<?php

namespace App\Http\Controllers;

use Google\Cloud\Storage\StorageClient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    // Upload caps: video 100MB, images 20MB. Every check below is
    // server-side — client checks are UX only and trivially bypassable.
    private const VIDEO_MAX_BYTES = 100 * 1024 * 1024;
    private const IMAGE_MAX_BYTES = 20 * 1024 * 1024;

    // MIME (server-sniffed) => safe extension. Anything else is rejected,
    // notably SVG (scriptable) and any executable/office/archive type.
    private const ALLOWED_MIME = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
        'video/mp4' => 'mp4',
        'video/quicktime' => 'mov',
    ];

    public function store(Request $request)
    {
        $data = $request->validate([
            'file' => 'required|file',
        ]);

        /** @var \Illuminate\Http\UploadedFile $file */
        $file = $data['file'];

        if (!$file->isValid()) {
            return response()->json(['message' => $this->uploadErrorMessage($file->getError())], 422);
        }

        // Server-side MIME sniffing — never trust the client Content-Type
        // or filename, both attacker-controlled.
        $mime = $file->getMimeType() ?: '';
        if (!isset(self::ALLOWED_MIME[$mime])) {
            return response()->json(['message' => 'Unsupported file type. Use JPG, PNG, WebP, GIF, MP4 or MOV.'], 422);
        }

        // Per-type size caps measured server-side (client checks are
        // bypassable): video 100MB, images 20MB.
        $isVideo = str_starts_with($mime, 'video/');
        $limit = $isVideo ? self::VIDEO_MAX_BYTES : self::IMAGE_MAX_BYTES;
        if (($file->getSize() ?: 0) > $limit) {
            return response()->json(['message' => $isVideo
                ? 'Video must be under 100MB.'
                : 'Image must be under 20MB.'], 422);
        }

        // Extension derived from the VERIFIED mime — never from the client
        // filename. This blocks shell.php / photo.php.jpg style uploads
        // from landing executable names on the public disk.
        $extension = self::ALLOWED_MIME[$mime];
        $mediaType = $isVideo ? 'video' : 'image';
        $name = 'bizlink/' . now()->format('Y/m/d') . '/' . Str::uuid() . '.' . $extension;

        $bucket = env('GOOGLE_CLOUD_STORAGE_BUCKET');

        if ($bucket) {
            try {
                return response()->json([
                    'url' => $this->storeToGcs($bucket, $name, $file->getRealPath(), $mime),
                    'media_type' => $mediaType,
                    'path' => $name,
                    'disk' => 'gcs',
                ], 201);
            } catch (\Exception $e) {
                Log::warning('GCS upload failed, falling back to local', ['message' => $e->getMessage()]);
            }
        }

        $path = $file->storeAs('bizlink/' . now()->format('Y/m/d'), Str::uuid() . '.' . $extension, 'public');

        return response()->json([
            'url' => asset('storage/' . $path),
            'media_type' => $mediaType,
            'path' => $path,
            'disk' => 'local',
        ], 201);
    }

    private function uploadErrorMessage(?int $code): string
    {
        return match ($code) {
            UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'File is too large. Videos up to 100MB and images up to 20MB are allowed.',
            UPLOAD_ERR_PARTIAL => 'Upload was interrupted. Please try again.',
            UPLOAD_ERR_NO_FILE => 'No file was received. Please try again.',
            default => 'Upload failed. Please try again.',
        };
    }

    private function storeToGcs(string $bucketName, string $name, string $tmpPath, string $mime): string
    {
        $options = ['projectId' => env('GOOGLE_CLOUD_PROJECT_ID') ?: null];
        if ($keyFile = env('GOOGLE_CLOUD_KEY_FILE')) {
            $options['keyFile'] = json_decode(file_get_contents($keyFile), true);
        }
        $storage = new StorageClient(array_filter($options));
        $bucket = $storage->bucket($bucketName);

        $object = $bucket->upload(fopen($tmpPath, 'r'), [
            'name' => $name,
            'metadata' => ['contentType' => $mime],
        ]);

        try {
            $object->update(['acl' => []], ['predefinedAcl' => 'publicRead']);
            return 'https://storage.googleapis.com/' . $bucketName . '/' . $name;
        } catch (\Exception $e) {
            return $object->signedUrl(new \DateTime('+7 days'), ['version' => 'v4']);
        }
    }
}
