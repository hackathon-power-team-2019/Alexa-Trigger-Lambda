Command Line
`aws lambda create-function --function-name SaveFundsDynamicAlexSlot --zip-file fileb://function.zip --handler index.handler --runtime nodejs8.10 --timeout 10 --memory-size 1024 --role arn:aws:iam::193612508529:role/service-role/Lambda-s3-role`

Response: 
```angular2
{
    "FunctionName": "SaveFundsDynamicAlexSlot",
    "FunctionArn": "arn:aws:lambda:us-east-1:193612508529:function:SaveFundsDynamicAlexSlot",
    "Runtime": "nodejs8.10",
    "Role": "arn:aws:iam::193612508529:role/service-role/Lambda-s3-role",
    "Handler": "index.handler",
    "CodeSize": 5915616,
    "Description": "",
    "Timeout": 10,
    "MemorySize": 1024,
    "LastModified": "2019-06-01T18:47:48.813+0000",
    "CodeSha256": "rGiKQYRzDs4YoDQ6fya0pfQguRFVW9Zj3ykIMFosZ9o=",
    "Version": "$LATEST",
    "TracingConfig": {
        "Mode": "PassThrough"
    },
    "RevisionId": "ff45914a-5996-4e9a-a4d9-8f1151cacf95"
}
```
`aws lambda update-function-configuration --function-name SaveFundsDynamicAlexSlot --timeout 30`

`aws lambda invoke --function-name SaveFundsDynamicAlexSlot --invocation-type Event \
 --payload file://inputfile.txt outputfile.txt`
 ## initial setup
 
 `aws lambda add-permission --function-name SaveFundsDynamicAlexSlot --principal s3.amazonaws.com \
  --statement-id fund-dynamic-perm-invoke-lmbda --action "lambda:InvokeFunction" \
  --source-arn arn:aws:s3:::fund-service-bucket \
  --source-account 193612508529`
 
  `aws lambda add-permission --function-name SaveFundsDynamicAlexSlot --principal lambda.amazonaws.com \
   --statement-id fund-dynamic-perm-write --action "s3:ListBucket" \
   --resource-arn arn:aws:s3:::fund-service-bucket \
   --source-account 193612508529`
   
 Output: 
 ```angularjs
 {
     "Statement": "{\"Sid\":\"fundFinder\",\"Effect\":\"Allow\",\"Principal\":{\"Service\":\"s3.amazonaws.com\"},\"Action\":\"lambda:InvokeFunction\",\"Resource\":\"arn:aws:lambda:us-east-1:193612508529:function:SaveFundsDynamicAlexSlot\",\"Condition\":{\"StringEquals\":{\"AWS:SourceAccount\":\"193612508529\"},\"ArnLike\":{\"AWS:SourceArn\":\"fundFinder\"}}}"
 }
 ```
 
 ```angularjs
 {
     "Policy": "{\"Version\":\"2012-10-17\",\"Id\":\"default\",\"Statement\":[{\"Sid\":\"fund-dynamic-perm-invoke-lmbda\",\"Effect\":\"Allow\",\"Principal\":{\"Service\":\"s3.amazonaws.com\"},\"Action\":\"lambda:InvokeFunction\",\"Resource\":\"arn:aws:lambda:us-east-1:193612508529:function:SaveFundsDynamicAlexSlot\",\"Condition\":{\"StringEquals\":{\"AWS:SourceAccount\":\"193612508529\"},\"ArnLike\":{\"AWS:SourceArn\":\"arn:aws:s3:::fund-service-bucket\"}}}]}",
     "RevisionId": "641f7187-457d-40ef-ba68-3bbd5c849ce4"
 }
``` 
 ## Deploy updates
 
 RUn this command in the shell:
 1) `zip -r function.zip .` ;  
 2) `aws lambda update-function-code --function-name SaveFundsDynamicAlexSlot --zip-file fileb://function.zip`
 