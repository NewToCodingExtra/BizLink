<?php

namespace App\Http\Controllers;

use Google\Cloud\Storage\StorageClient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'file' => 'required|file|mimes:jpg,jpeg,png,webp,gif,mp4,mov|max:20480',
        ]);

        $file = $data['file'];
        $mime = $file->getMimeType() ?: '';
        $mediaType = str_starts_with($mime, 'video') ? 'video' : 'image';
        $name = 'bizlink/' . now()->format('Y/m/d') . '/' . Str::uuid() . '.' . $file->getClientOriginalExtension();

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

        $path = $file->storeAs('bizlink/' . now()->format('Y/m/d'), Str::uuid() . '.' . $file->getClientOriginalExtension(), 'public');

        return response()->json([
            'url' => asset('storage/' . $path),
            'media_type' => $mediaType,
            'path' => $path,
            'disk' => 'local',
        ], 201);
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
