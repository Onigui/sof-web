<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'service' => 'SOF API',
        'status' => 'ok',
        'docs' => 'Backend JSON — o portal operacional fica no Vercel.',
        'health' => url('/up'),
        'api_base' => url('/api/v1'),
        'login' => url('/api/v1/auth/login'),
    ]);
});
