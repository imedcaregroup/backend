import AWS from "aws-sdk";

// Set up the AWS S3 configuration
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Your AWS Access Key ID
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // Your AWS Secret Access Key
  region: process.env.AWS_REGION, // The AWS region of your S3 bucket
});

const s3 = new AWS.S3();

export default s3;
