const { getOptions } = require('loader-utils');
const validateOptions = require('schema-utils');
const Airtable = require('airtable');

const optionsSchema = {
    type: 'object',
    properties: {
        apiKey: {
            type: 'string'
        }
    }
};

const airtableLoader = function (source) {
    const callback = this.async();
    const options = getOptions(this);
    validateOptions(optionsSchema, options, 'Airtable Loader');

    const tableOptions = JSON.parse(source);

    const { apiKey } = options;
    const { baseId, tableName, fields, maxRecords } = tableOptions;
    const base = new Airtable({ apiKey }).base(baseId);

    const data = [];

    base(tableName)
        .select({
            maxRecords,
            view: 'Grid view'
        })
        .eachPage(
            (records, fetchNextPage) => {
                records.forEach((record) => {
                    const row = {};
                    fields.forEach(({ mapToName = '', airtableName = 'unknown' }) => {
                        row[mapToName || airtableName]  = record.get(airtableName);
                    });
                    data.push(row);
                });

                fetchNextPage();
            },
            (err) => {
                if (err) {
                    console.error(err);
                    return;
                }

                // TODO: convert to JSON.parse for larger sets of data
                callback(err, `export default ${JSON.stringify(data)}`);
            });
};

module.exports = airtableLoader;
