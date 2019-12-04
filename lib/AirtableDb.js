const Airtable = require('airtable');
const _ = require('lodash');
const Promise = require('bluebird');

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

class AirtableDb {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.requestCounter = 0;
        this.cachedHitsCounter = 0;
        this.dataCache = {};
    }

    getCachedRecord(baseId, tableName, id) {
        const record = _.get(this.dataCache, `${baseId}-${tableName}-${id}`, false);
        if (record) {
            this.cachedHitsCounter++;
        }
        return record;
    }

    setCachedRecord(baseId, tableName, id, record) {
        this.dataCache[`${baseId}-${tableName}-${id}`] = record;
    }

    getRequestCounter() {
        return this.requestCounter;
    }

    getCachedHitsCounter() {
        return this.cachedHitsCounter;
    }

    async fetchAirtableData(tableOptions) {
        const records = await this.selectAllRecords(tableOptions);
        return this.convertRecordsToDataRows(records, tableOptions);
    }

    async selectAllRecords(tableOptions) {
        const { baseId, tableName, maxRecords, view = 'Grid view' } = tableOptions;

        return new Promise((resolve, reject) => {
            this.requestCounter++;
            const base = new Airtable({ apiKey: this.apiKey }).base(baseId);
            const recordPages = [];
            base(tableName)
                .select({
                    maxRecords,
                    view
                })
                .eachPage(
                    (records, fetchNextPage) => {
                        recordPages.push(records);
                        fetchNextPage();
                    },
                    (err) => {
                        if (err) {
                            reject(err);
                        }

                        // Flatten the record pages into one array
                        resolve(_.flatMap(recordPages));
                    });
        });
    };

    async selectSingleRecord(id, tableOptions) {
        const { baseId, tableName } = tableOptions;
        const base = new Airtable({ apiKey: this.apiKey }).base(baseId);

        return new Promise((resolve, reject) => {
            // Look for cached record
            const cachedRecord = this.getCachedRecord(baseId, tableName, id);
            if (cachedRecord) {
                resolve(cachedRecord);
                return;
            }

            // Get result from Airtable
            this.requestCounter++;
            base(tableName).find(id, (err, record) => {
                if (err) {
                    reject(err);
                    return;
                }
                this.setCachedRecord(baseId, tableName, id, record);
                resolve(record)
            });
        });
    }

    async convertRecordsToDataRows(records, tableOptions) {
        const dataRows = records.map(async (record) => await this.convertRecordToDataRow(record, tableOptions));
        return Promise.all(dataRows);
    }

    async convertRecordToDataRow(record, tableOptions) {
        const { fields } = tableOptions;
        const row = {};

        await asyncForEach(fields, async ({ mapToName = '', name = 'unknown', resolve }) => {
            if (resolve) {
               // Need to resolve the contents of this field by querying another table
                const recordKeys = record.get(name);
                const records = await Promise.all(recordKeys).map((id) => this.selectSingleRecord(id, resolve), { concurrency: 1 });
                row[mapToName || name] = await this.convertRecordsToDataRows(records, resolve);
            } else {
                // Standard field, return the results
                row[mapToName || name] = record.get(name);
            }
        });

        return row;
    };
}

module.exports = AirtableDb;
