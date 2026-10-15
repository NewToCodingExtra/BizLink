<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT_URI', 'http://localhost:8000/api/auth/google/callback'),
        // Meet/Calendar OAuth must send ONE fixed redirect_uri that is
        // registered verbatim in Google Console. Empty = APP_URL/meet/callback.
        'meet_redirect' => env('GOOGLE_MEET_REDIRECT_URI'),
    ],

    'facebook' => [
        'client_id' => env('FACEBOOK_CLIENT_ID'),
        'client_secret' => env('FACEBOOK_CLIENT_SECRET'),
        'redirect' => env('FACEBOOK_REDIRECT_URI', 'http://localhost:8000/api/auth/facebook/callback'),
    ],

    // One-click "try the demo" sign-in on /login. The accounts are public
    // seed data, so this leaks nothing — but set DEMO_LOGIN=false in any
    // real deployment.
    'demo' => [
        'enabled' => env('DEMO_LOGIN', true),
    ],

    'gcs' => [
        'bucket' => env('GOOGLE_CLOUD_STORAGE_BUCKET'),
        'project_id' => env('GOOGLE_CLOUD_PROJECT_ID'),
        'key_file' => env('GOOGLE_CLOUD_KEY_FILE'),
    ],

    'frontend' => [
        'url' => env('FRONTEND_URL', env('APP_URL', 'http://localhost:8000')),
        'google_success' => env('GOOGLE_FRONTEND_SUCCESS'),
    ],

];
