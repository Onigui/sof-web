<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\EmpresaSubscription;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->authorizeGestao($user);

        $subscription = $this->getOrCreateSubscription($user->empresa_id);

        return response()->json([
            'data' => $subscription,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->authorizeGestao($user);

        $validated = $request->validate([
            'status' => ['required', 'in:TRIAL,ATIVA,SUSPENSA'],
            'trial_ends_at' => ['nullable', 'date'],
            'grace_days' => ['nullable', 'integer', 'min:0'],
        ]);

        $subscription = $this->getOrCreateSubscription($user->empresa_id);

        $subscription->status = $validated['status'];

        if (array_key_exists('trial_ends_at', $validated)) {
            $subscription->trial_ends_at = $validated['trial_ends_at'];
        }

        if (array_key_exists('grace_days', $validated)) {
            $subscription->grace_days = $validated['grace_days'];
        }

        if ($subscription->status === EmpresaSubscription::STATUS_ATIVA && $subscription->active_since === null) {
            $subscription->active_since = now();
        }

        if ($subscription->status === EmpresaSubscription::STATUS_SUSPENSA) {
            $subscription->suspended_at = now();
        }

        $subscription->save();

        return response()->json([
            'data' => $subscription,
        ]);
    }

    private function getOrCreateSubscription(int $empresaId): EmpresaSubscription
    {
        return EmpresaSubscription::firstOrCreate(
            ['empresa_id' => $empresaId],
            [
                'status' => EmpresaSubscription::STATUS_TRIAL,
                'trial_ends_at' => Carbon::now()->addDays(14),
                'grace_days' => 0,
            ]
        );
    }

    private function authorizeGestao(User $user): void
    {
        if ($user->role !== User::ROLE_GESTAO) {
            abort(403);
        }
    }
}
