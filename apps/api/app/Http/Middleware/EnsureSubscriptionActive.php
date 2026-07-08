<?php

namespace App\Http\Middleware;

use App\Models\EmpresaSubscription;
use Carbon\Carbon;
use Closure;
use Illuminate\Http\Request;

class EnsureSubscriptionActive
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (!$user) {
            return $next($request);
        }

        $subscription = EmpresaSubscription::firstOrCreate(
            ['empresa_id' => $user->empresa_id],
            [
                'status' => EmpresaSubscription::STATUS_TRIAL,
                'trial_ends_at' => Carbon::now()->addDays(14),
                'grace_days' => 0,
            ]
        );

        if ($subscription->status === EmpresaSubscription::STATUS_ATIVA) {
            return $next($request);
        }

        if ($subscription->status === EmpresaSubscription::STATUS_SUSPENSA) {
            return $this->blockedResponse($subscription);
        }

        $trialEndsAt = $subscription->trial_ends_at;

        if ($trialEndsAt) {
            $limite = $trialEndsAt->copy()->addDays($subscription->grace_days ?? 0);

            if (Carbon::now()->lte($limite)) {
                return $next($request);
            }
        }

        return $this->blockedResponse($subscription);
    }

    private function blockedResponse(EmpresaSubscription $subscription)
    {
        return response()->json([
            'error' => 'subscription_required',
            'status' => $subscription->status,
            'trial_ends_at' => $subscription->trial_ends_at?->toDateTimeString(),
        ], 402);
    }
}
