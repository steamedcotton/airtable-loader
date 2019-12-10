const Airtable = require('airtable');
const _ = require('lodash');
const Promise = require('bluebird');
const chalk = require('chalk');

const ERROR_PREFIX = chalk.blue('\nairtable-loader: ');

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
        const cacheKey = `${baseId}-${tableName}-${id}`;
        const record = _.get(this.dataCache, cacheKey, false);
        if (record) {
            this.cachedHitsCounter++;
        }
        return record;
    }

    setCachedRecord(baseId, tableName, record) {
        const cacheKey = `${baseId}-${tableName}-${record.id}`;
        this.dataCache[cacheKey] = record;
    }

    getRequestCounter() {
        return this.requestCounter;
    }

    getCachedHitsCounter() {
        return this.cachedHitsCounter;
    }

    async fetchAirtableData(tableOptions) {
        const { cacheTables = [], includeFilterFieldName} = tableOptions;

        // Cache the whole table to save on requests to Airtable
        if (_.isArray(cacheTables)) {
            await asyncForEach(cacheTables, async (cacheTableOptions) => {
                await this.selectAllRecords(cacheTableOptions, true);
            })
        }

        const records = await this.selectAllRecords(tableOptions);

        let resolvedRecords = await this.convertRecordsToDataRows(records, tableOptions);

        if (_.isString(includeFilterFieldName)) {
            resolvedRecords = resolvedRecords.filter((record) => record[includeFilterFieldName]);
        }

        return resolvedRecords;
    }

    async selectAllRecords(tableOptions, cacheTable = false) {
        const { baseId, tableName, maxRecords = 1000, view = 'Grid view' } = tableOptions;

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
                        // Cache the record to save on requests to Airtable
                        if (cacheTable) {
                            records.forEach((record) => this.setCachedRecord(baseId, tableName, record))
                        }
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
                this.setCachedRecord(baseId, tableName, record);
                resolve(record);
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
        if (_.isArray(fields)) {
            await asyncForEach(fields, async ({ mapToName, name, resolve }) => {
                if (resolve) {
                    // Need to resolve the contents of this field by querying another table
                    const recordKeys = record.get(name);
                    if (_.isEmpty(recordKeys)) {
                        row[mapToName || name] = [];
                    } else if (!_.isArray(recordKeys)) {
                        row[mapToName || name] = [];
                        console.log(ERROR_PREFIX, chalk.red(`The field [${name}] should be an array of ids, instead it is a ${typeof recordKeys}`));
                    } else {
                        const records = await Promise.all(recordKeys).map((id) => this.selectSingleRecord(id, resolve), { concurrency: 1 });
                        row[mapToName || name] = await this.convertRecordsToDataRows(records, resolve);
                    }
                } else {
                    // Standard field, return the results
                    row[mapToName || name] = record.get(name);
                }
            });
        } else {
            console.log(ERROR_PREFIX, chalk.red('[fields] property from table options is not an array'));
        }

        return row;
    };
}

module.exports = AirtableDb;
