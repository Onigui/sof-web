<?php

$frontendUrl = env('FRONTEND_URL');
$extraOrigins = env('CORS_ALLOWED_ORIGINS', '');

$origins = array_filter([
    $frontendUrl ? rtrim($frontendUrl, '/') : null,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    ...array_filter(array_map(
        fn (string $origin) => rtrim(trim($origin), '/'),
        $extraOrigins !== '' ? explode(',', $extraOrigins) : []
    )),
]);

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie', 'up'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_unique($origins)),

    'allowed_origins_patterns' => [
        '#^https://[a-z0-9-]+\.vercel\.app$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
