const { getOptions } = require('loader-utils');
const validateOptions = require('schema-utils');
const _ = require('lodash');
const chalk = require('chalk');
const filesize = require('filesize');
const AirtableDb = require('./lib/AirtableDb');

const optionsSchema = {
    type: 'object',
    properties: {
        apiKey: {
            type: 'string'
        },
        showStats: {
            type: 'boolean'
        }
    }
};

function byteCount(s) {
    return encodeURI(s).split(/%..|./).length - 1;
}

const airtableLoader = function (source) {
    const callback = this.async();

    const runLoader = async () => {
        const options = getOptions(this);
        validateOptions(optionsSchema, options, 'Airtable Loader');

        const tableOptions = JSON.parse(source);

        const { apiKey, showStats = false } = options;
        const airtableDb = new AirtableDb(apiKey);
        try {
            const records = await airtableDb.fetchAirtableData(tableOptions);
            const jsonParsedResults = JSON.stringify(records);
            const sizeInBytes = byteCount(jsonParsedResults);

            if (showStats) {
                console.log('\n');
                console.log(chalk.blue('----- airtable-loader stats -----'));
                console.log(`${chalk.blue('Source File:')} ${this.resourcePath}`);
                console.log(`${chalk.blue('Result Size:')} ${filesize(sizeInBytes)}`);
                console.log(`${chalk.blue('Requests to Airtable:')} ${airtableDb.getRequestCounter()}`);
                console.log(`${chalk.blue('Cache Hits:')} ${airtableDb.getCachedHitsCounter()}`);
                console.log('\n');
            }

            // TODO: convert to JSON.parse for larger sets of data
            callback(null, `export default ${JSON.stringify(records)}`);
        } catch (err) {
            callback(err);
        }
    };

    runLoader();
};

module.exports = airtableLoader;
