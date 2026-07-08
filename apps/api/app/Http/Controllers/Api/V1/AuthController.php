<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\EmpresaSubscription;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (!Auth::attempt($credentials)) {
            throw ValidationException::withMessages([
                'email' => ['Credenciais inválidas.'],
            ]);
        }

        $user = $request->user();
        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $this->userPayload($user),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logout realizado com sucesso.',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $this->userPayload($request->user()),
        ]);
    }

    private function userPayload($user): array
    {
        $subscription = EmpresaSubscription::firstOrCreate(
            ['empresa_id' => $user->empresa_id],
            [
                'status' => EmpresaSubscription::STATUS_TRIAL,
                'trial_ends_at' => Carbon::now()->addDays(14),
                'grace_days' => 0,
            ]
        );

        return [
            'id' => $user->id,
            'name' => $user->name,
            'role' => $user->role,
            'empresa_id' => $user->empresa_id,
            'subscription' => [
                'status' => $subscription->status,
                'trial_ends_at' => $subscription->trial_ends_at?->toDateTimeString(),
                'grace_days' => $subscription->grace_days,
            ],
        ];
    }
}
