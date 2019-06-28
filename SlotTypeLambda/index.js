// dependencies
const async = require('async');
const AWS = require('aws-sdk');

// get reference to S3 client
const s3 = new AWS.S3();

const FUND_DATA_FILENAME = 'funddata.json';

exports.handler = function(event, context, callback) {
    // Read options from the event.
    //console.log("Reading options from event:\n", util.inspect(event, {depth: 5}));
    let srcBucket = event.Records[0].s3.bucket.name;
    // Object key may have spaces or unicode non-ASCII characters.
    var srcKey    = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));


    if (srcKey !== FUND_DATA_FILENAME) {
        // only index if it is the funddata.json file.  This lambda is specifically for that.
        callback("Not the " + FUND_DATA_FILENAME + " file. Ignoring the file.");
        return ;
    }
    const dstBucket = srcBucket;
    const dstKey    = "dynamic-slot-type-" + srcKey;

    // // Sanity check: validate that source and destination are different buckets.
    // if (srcBucket === dstBucket) {
    //     callback("Source and destination buckets are the same.");
    //     return;
    // }

    // Download the image from S3, transform, and upload to a different S3 bucket.
    async.waterfall([
            function download(next) {
                // Download the image from S3 into a buffer.
                s3.getObject({
                        Bucket: srcBucket,
                        Key: FUND_DATA_FILENAME
                    },
                    next);
            },
            function transform(response, next) {

                const products = JSON.parse(response.Body.toString());

                const dynamicFundSlotType = [];
                console.log (`Number of products ${products.length}`);
                products.forEach( (fund) => {
                    console.log(JSON.stringify(fund));
                    let productName = fund.productName.replace(/[^a-zA-Z ]+/g, '').replace(/\s\s+/g, ' ').toLowerCase();
                    let productName2 = productName.replace(' fund', '').replace(' class', '').trim();
                    dynamicFundSlotType.push({
                            id: fund.productCode,
                            name: {
                                value: fund.productName,
                                synonyms: [ fund.cusip, fund.ticker, productName, productName2, fund.productCode.toLowerCase() ]
                            }
                        }
                    );
                });

                let replaceEntityDirective = {
                    type: 'Dialog.UpdateDynamicEntities',
                    updateBehavior: 'REPLACE',
                    types: [{
                            name: "TRP_FUND_CODE",
                            values: dynamicFundSlotType
                    }]
                };
                next(null, replaceEntityDirective);
            },
            function upload(data, next) {
                // Stream the transformed image to a different S3 bucket.
                s3.putObject({
                        Bucket: dstBucket,
                        Key: dstKey,
                        Body: JSON.stringify(data),
                        ContentType: 'application/json',
                        ACL: 'public-read'
                    },
                    next);
            }
        ], function (err, data) {
            if (err) {
                console.error(
                    'Unable to read from ' + srcBucket + '/' + srcKey +
                    ' and upload a dynamic slot type for ' + dstBucket + '/' + dstKey +
                    ' due to an error: ' + JSON.stringify(err)
                );
            } else {
                console.log(
                    'Successfully generated slot type for Mutual Funds ' + srcBucket + '/' + srcKey +
                    ' and uploaded to ' + dstBucket + '/' + dstKey
                );
            }

            callback(null, "message");
        }
    );
};