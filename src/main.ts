import { Observable, Observer } from "rxjs";
import { config as awsconfig, S3, EC2 as ec2, MetadataService, DynamoDB } from "aws-sdk";
import * as path from "path";
import { Logger } from "./logger";
import { CredentialsOptions } from 'aws-sdk/lib/credentials';

const logger = new Logger();
const currentFile = __filename.slice(__dirname.length + 1);


export class UserCredentials {
    /**
     * AWS access key ID.
     */
    accessKeyId: string
    /**
     * AWS secret access key.
     */
    secretAccessKey: string
    /**
     * AWS Region
     */
    region:string;
    /**
     * AWS dynamodb endpoint
     */
    endpoint: string;
    
}





class Startup {
    public static main(): number {
        // Create S3 service object
        let s3: S3 = new S3({ apiVersion: '2006-03-01' });
        let userId = "pdhar";


        // awsconfig.loadFromPath('./config/awsconfig.json');
        this.getAWSConnection()
        .map(conn=>{
            return this.scanUserContributions(conn.s3, userId)
        })
        .flatMap(result=>result)
        .subscribe(
            result => {
                console.log(JSON.stringify(result, null, "   "));
            },
            err => console.error(err)
        );
        return 0;
    }
    /**
     * Get AWS connection
     */
    static getAWSConnection(): Observable<any> {
        let ec2MetaDataService = new MetadataService({ httpOptions: { timeout: 5000 } });
        let ec2MetaDataSvc = Observable.bindNodeCallback<any>(
            ec2MetaDataService.request.bind(ec2MetaDataService), (params) => params);
        let getCredentials = Observable.bindCallback<any>(
            awsconfig.getCredentials.bind(awsconfig), (params) => params);
        return Observable.create(observer => {
            ec2MetaDataSvc("/latest/dynamic/instance-identity/document")
                .subscribe(
                data => {
                    logger.log(logger.LOG_INFO, "", currentFile, "Found ec2 dynamic instance identity");
                    let awsInstanceIdentity = JSON.parse(data);
                    getCredentials()
                        .subscribe(
                        err => { // AWS Envrionment
                            if (err) {
                                logger.log(logger.LOG_ERROR, "", currentFile, "Credentials not loaded, " + err.stack);
                                observer.error(err);
                            } else {
                                // pass AWS.config.credentials properties to your SimpleDB code
                                awsconfig.region = awsInstanceIdentity.region;
                                awsconfig.update({ sslEnabled: false });
                                let s3: S3 = new S3({ apiVersion: '2006-03-01' });
                                let dynamodb = new DynamoDB();
                                logger.log(logger.LOG_INFO, "", currentFile, "Connectting to AWS dynamodb");
                                observer.next({ s3: s3, dynamodb: dynamodb });
                            }
                            observer.complete();
                        });
                },
                err => {
                    // Local Environment
                    let credential = new UserCredentials();
                    logger.log(logger.LOG_INFO, "", currentFile, "Failed to connect ec2 instance, running in local");
                    if (process.env.AWS_ACCESS_KEY_ID) {
                        credential.accessKeyId = process.env.AWS_ACCESS_KEY_ID;
                    } else {
                        credential.accessKeyId = "troposphere";
                    }

                    if (process.env.AWS_SECRET_ACCESS_KEY) {
                        credential.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
                    } else {
                        credential.secretAccessKey = "troposphere";
                    }

                    if (process.env.AWS_REGION) {
                        credential.region = process.env.AWS_REGION;
                    } else {
                        credential.region = "us-east-1";
                    }
                    if (process.env.DYNAMODB_ENDPOINT) {
                        credential.endpoint = process.env.DYNAMODB_ENDPOINT;
                    }

                    logger.debug("", "The local db credential: " + JSON.stringify(credential, null, 1));
                    let dbLink = credential.endpoint;
                    if (process.env.DB_PORT) {
                        dbLink = process.env.DB_PORT.replace("tcp://", "http://");
                    }
                    awsconfig.update(credential);
                    let s3: S3 = new S3({ apiVersion: '2006-03-01' });
                    let databaseConfig = { "endpoint": dbLink };
                    let dynamodb = new DynamoDB(databaseConfig);
                    logger.log(logger.LOG_INFO, "", currentFile, "Connectting to local dynamodb");
                    observer.next({ s3: s3, dynamodb: dynamodb });
                    observer.complete();
                }
                );
        });


    }
    /**
     * Scan user contributions
     * @param s3 S3 connection
     * @param userId  User Id
     */
    static scanUserContributions(s3: S3, userId: string): Observable<any> {
        let s3Bucket: string;
        let contributionFilter: string[] = ["activity.json", "trigger.json", "function.json"];
        let listBuckets = Observable.bindNodeCallback<any>(s3.listBuckets.bind(s3));
        let listObjects = Observable.bindNodeCallback<any>(s3.listObjects.bind(s3),
            (params: S3.ListObjectsRequest) => {
                return params;
            });
        let getObject = Observable.bindNodeCallback<any>(s3.getObject.bind(s3),
            (params: S3.GetObjectRequest) => {
                return params;
            });
        return listBuckets()
            .map(result => {
                return result.Buckets;
            })
            .flatMap(bucket => {
                return bucket;
            })
            .map(bucket => {
                s3Bucket = (<any>bucket).Name;
                let param: S3.ListObjectsRequest = { Bucket: s3Bucket, Prefix: userId };
                return listObjects(param);
            })
            .flatMap(objects => objects)
            .map(object => (<any>object).Contents)
            .flatMap(contents => contents)
            .map(content => (<any>content))
            .map(content => <string>(<any>content).Key)
            // .map(key=>key.replace(/^.*[\\\/]/, ''))
            .filter((key: string, index: number) => contributionFilter.indexOf(key.replace(/^.*[\\\/]/, '')) >= 0)
            .map(key => {
                let param: S3.GetObjectRequest = { Bucket: s3Bucket, Key: key }
                return getObject(param);
            })
            .flatMap(object => object)
            .map(object => JSON.parse(object.Body.toString("utf-8")))
    }
}

Startup.main();