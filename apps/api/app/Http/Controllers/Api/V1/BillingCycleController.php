<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\BillingCycleService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BillingCycleController extends Controller
{
    public function run(Request $request, BillingCycleService $service): JsonResponse
    {
        $user = $request->user();
        $this->authorizeGestao($user);

        $validated = $request->validate([
            'month' => ['nullable', 'date_format:Y-m'],
        ]);

        $month = $validated['month'] ?? Carbon::now()->format('Y-m');

        $service->generateMonthlyInvoicesForCurrentMonth($month);

        return response()->json([
            'message' => 'Ciclo de cobrança executado.',
        ]);
    }

    public function dunning(Request $request, BillingCycleService $service): JsonResponse
    {
        $user = $request->user();
        $this->authorizeGestao($user);

        $service->runDunningForDate(Carbon::today());

        return response()->json([
            'message' => 'Dunning executado.',
        ]);
    }

    private function authorizeGestao(User $user): void
    {
        if ($user->role !== User::ROLE_GESTAO) {
            abort(403);
        }
    }
}
