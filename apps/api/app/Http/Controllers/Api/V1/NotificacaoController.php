<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;

class NotificacaoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $notificacoes = $user->notifications()
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => $notificacoes,
        ]);
    }

    public function marcarLida(Request $request, DatabaseNotification $notification): JsonResponse
    {
        $user = $request->user();

        if ($notification->notifiable_id !== $user->id) {
            abort(404);
        }

        $notification->markAsRead();

        return response()->json([
            'data' => $notification,
        ]);
    }
}
