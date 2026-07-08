<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'role' => ['nullable', 'string'],
        ]);

        $user = $request->user();

        $query = User::query()
            ->where('empresa_id', $user->empresa_id)
            ->orderBy('name');

        if (!empty($validated['role'])) {
            $query->where('role', $validated['role']);
        }

        $items = $query->get(['id', 'name', 'email', 'role'])->map(fn (User $item) => [
            'id' => $item->id,
            'name' => $item->name,
            'email' => $item->email,
            'role' => $item->role,
        ]);

        return response()->json(['data' => $items]);
    }
}
