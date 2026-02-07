Master Prompt: S3 Infrastructure & Image Pipeline Refactor
Context: I need to refactor my YouTube Seed Script (v3) to move from local image storage to Amazon S3. We are scaling to 5,000+ creators, and local storage is no longer viable. You have full access to AWS to create the necessary resources.

Task 1: Infrastructure Setup (ensureS3Infrastructure)

Import @aws-sdk/client-s3 and @aws-sdk/lib-storage.

Create a function that:

Checks if process.env.S3_BUCKET_NAME exists. If not, creates it.

Configures Public Access: Disables "Block Public Access" and applies a Bucket Policy allowing s3:GetObject for Principal: "\*".

Configures CORS: Allows GET requests from any origin (to ensure images load on our Next.js frontend).

Task 2: Refactor Image Handling (uploadToS3)

Replace the current downloadImage function with a new uploadToS3(url, slug, type) function.

Logic: 1. Fetch the image from the YouTube URL. 2. Use the Upload class from @aws-sdk/lib-storage to stream the image directly to S3. 3. S3 Key Structure: creators/${slug}/${type}.jpg. 4. Content-Type: Set to image/jpeg.

Return Value: Return the full public S3 URL: https://${bucket}.s3.${region}.amazonaws.com/creators/${slug}/${type}.jpg.

Task 3: Script Integration

In the processChannelBatch and buildCreatorItem logic:

Call uploadToS3 for the Profile Image and Banner Image.

Update the DynamoDB item so profilePicUrl, primaryProfileImage, bannerUrl, and coverImageUrl all store these new S3 URLs.

Error Handling: If an image fails to upload, fallback to the original YouTube URL in the database so the profile isn't broken.

Task 4: Optimization & Quota Protection

ETag Skip: Ensure that if a channel is skipped via the youtubeEtag check, we also skip the S3 upload to save bandwidth and time.

Parallel Uploads: Ensure images are uploaded in parallel using Promise.all within each batch of 50 creators.

Final Deliverable: Provide the complete, updated .mjs script including all new AWS SDK imports and the refined logic.
