const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const sharp = require("sharp"); // Image processing library

module.exports.resizeAndUploadImage = async (event) => {
  // Read data from event object.
  const region = event.Records[0].awsRegion;
  const sourceBucket = event.Records[0].s3.bucket.name;
  console.log(region, sourceBucket);
  // Object key may have spaces or unicode non-ASCII characters

  const sourceKey = decodeURIComponent(
    event.Records[0].s3.object.key.replace(/\+/g, " ")
  );

  // Instantiate a new S3 client.
  console.log(sourceKey, sourceBucket);
  try {
    const s3Client = new S3Client({
      region: region,
    });
    const params = {
      Bucket: sourceBucket,
      Key: sourceKey,
    };
    console.log(params);
    const { Body, ContentType } = await s3Client.send(
      new GetObjectCommand(params)
    );
    const image = await Body.transformToByteArray();
    console.log(Body);
    console.log("Before resize");
    // Resize the image
    const resizedImage = await sharp(image)
      .resize(200) // Specify the desired dimensions
      .toBuffer();

    console.log("After resize");
    // Upload the resized image to the target S3 bucket
    await s3Client.send(
      new PutObjectCommand({
        Bucket: "mylambas3bucketdemo",
        Key: sourceKey, // Use the same key as the original image
        Body: resizedImage,
        ContentType,
      })
    );

    return "Image resized and uploaded successfully";
  } catch (error) {
    console.error(error);
    throw error;
  }
};
