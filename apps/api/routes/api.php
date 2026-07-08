<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\AuditoriaController;
use App\Http\Controllers\Api\V1\BancoController;
use App\Http\Controllers\Api\V1\BillingController;
use App\Http\Controllers\Api\V1\BillingCycleController;
use App\Http\Controllers\Api\V1\BillingInvoiceController;
use App\Http\Controllers\Api\V1\BillingWebhookController;
use App\Http\Controllers\Api\V1\DetranQueryController;
use App\Http\Controllers\Api\V1\DocumentoController;
use App\Http\Controllers\Api\V1\DutController;
use App\Http\Controllers\Api\V1\FilaController;
use App\Http\Controllers\Api\V1\IntegracaoController;
use App\Http\Controllers\Api\V1\LeadController;
use App\Http\Controllers\Api\V1\LojaController;
use App\Http\Controllers\Api\V1\LojaLeadController;
use App\Http\Controllers\Api\V1\NotificacaoController;
use App\Http\Controllers\Api\V1\PendenciaController;
use App\Http\Controllers\Api\V1\ProdutoController;
use App\Http\Controllers\Api\V1\PropostaController;
use App\Http\Controllers\Api\V1\RegiaoController;
use App\Http\Controllers\Api\V1\RegiaoNormalizacaoController;
use App\Http\Controllers\Api\V1\RelatorioFechamentoController;
use App\Http\Controllers\Api\V1\RelatorioController;
use App\Http\Controllers\Api\V1\SubscriptionController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Middleware\EnsureSubscriptionActive;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('billing/webhooks/{provider}', [BillingWebhookController::class, 'handle'])
        ->middleware('throttle:20,1');

    Route::prefix('auth')->group(function () {
        Route::post('login', [AuthController::class, 'login']);

        Route::middleware('auth:sanctum')->group(function () {
            Route::post('logout', [AuthController::class, 'logout']);
            Route::get('me', [AuthController::class, 'me']);
        });
    });

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me', [AuthController::class, 'me']);

        Route::post('billing/cycle/run', [BillingCycleController::class, 'run']);
        Route::post('billing/cycle/dunning', [BillingCycleController::class, 'dunning']);
        Route::get('billing/invoices', [BillingInvoiceController::class, 'show']);
        Route::post('billing/invoices/{invoice}/checkout', [BillingInvoiceController::class, 'checkout']);
        Route::post('billing/invoices/{invoice}/mark-paid', [BillingInvoiceController::class, 'markPaid']);
        Route::get('billing/events', [BillingController::class, 'events']);
        Route::patch('billing/settings', [BillingController::class, 'settings']);
        Route::get('billing/summary', [BillingController::class, 'summary']);

        Route::get('bancos', [BancoController::class, 'index']);
        Route::post('bancos', [BancoController::class, 'store']);
        Route::patch('bancos', [BancoController::class, 'update']);

        Route::get('produtos', [ProdutoController::class, 'index']);
        Route::post('produtos', [ProdutoController::class, 'store']);
        Route::patch('produtos', [ProdutoController::class, 'update']);

        Route::get('lojas', [LojaController::class, 'index']);
        Route::post('lojas', [LojaController::class, 'store']);
        Route::patch('lojas', [LojaController::class, 'update']);

        Route::get('regioes', [RegiaoController::class, 'index']);
        Route::post('regioes', [RegiaoController::class, 'store']);
        Route::patch('regioes', [RegiaoController::class, 'update']);
        Route::get('regioes/pending-normalization', [RegiaoNormalizacaoController::class, 'pendingNormalization']);
        Route::post('regioes/normalize', [RegiaoNormalizacaoController::class, 'normalize']);

        Route::get('users', [UserController::class, 'index']);

        Route::get('dut', [DutController::class, 'index']);
        Route::post('dut/{dut}/comprovante', [DutController::class, 'comprovante']);
        Route::post('dut/{dut}/ok', [DutController::class, 'ok']);

        Route::get('detran/queries', [DetranQueryController::class, 'index']);
        Route::post('detran/queries', [DetranQueryController::class, 'store']);
        Route::post('detran/queries/{detranQuery}/complete-manual', [DetranQueryController::class, 'completeManual']);

        Route::get('auditoria', [AuditoriaController::class, 'index']);
        Route::get('auditoria/export', [AuditoriaController::class, 'export']);
        Route::get('audit', [AuditoriaController::class, 'index']);
        Route::get('audit/export', [AuditoriaController::class, 'export']);

        Route::get('loja/leads', [LojaLeadController::class, 'index']);
        Route::post('loja/leads', [LojaLeadController::class, 'store']);
        Route::get('loja/leads/{lead}', [LojaLeadController::class, 'show']);

        Route::get('leads', [LeadController::class, 'index']);
        Route::post('leads/{lead}/converter', [LeadController::class, 'converter']);

        Route::get('fila', [FilaController::class, 'index']);
        Route::get('notificacoes', [NotificacaoController::class, 'index']);
        Route::post('notificacoes/{notification}/ler', [NotificacaoController::class, 'marcarLida']);

        Route::get('relatorios/aprovadas', [RelatorioController::class, 'aprovadas']);
        Route::get('relatorios/aprovadas/export', [RelatorioController::class, 'aprovadasExport']);
        Route::get('relatorios/fechamento', [RelatorioFechamentoController::class, 'index']);
        Route::get('relatorios/fechamento/{relatorioRun}/download', [RelatorioFechamentoController::class, 'download']);
        Route::post('relatorios/fechamento/{data_ref}/reenviar', [RelatorioFechamentoController::class, 'reenviar']);
        Route::get('relatorios/integradas', [RelatorioController::class, 'integradas']);
        Route::get('relatorios/integradas/export', [RelatorioController::class, 'integradasExport']);

        Route::get('subscription', [SubscriptionController::class, 'show']);
        Route::patch('subscription', [SubscriptionController::class, 'update']);

        Route::get('propostas', [PropostaController::class, 'index']);
        Route::post('propostas', [PropostaController::class, 'store']);
        Route::get('propostas/{proposta}', [PropostaController::class, 'show']);
        Route::patch('propostas/{proposta}', [PropostaController::class, 'update']);
        Route::get('propostas/{proposta}/precheck', [PropostaController::class, 'precheck']);
        Route::get('propostas/{proposta}/audit', [PropostaController::class, 'audit']);
        Route::post('propostas/{proposta}/enviar', [PropostaController::class, 'enviar']);
        Route::post('propostas/{proposta}/transferir', [PropostaController::class, 'transferir']);
        Route::post('propostas/{proposta}/ajustar-status', [PropostaController::class, 'ajustarStatus']);
        Route::post('propostas/{proposta}/integrar', [IntegracaoController::class, 'integrar'])
            ->middleware(EnsureSubscriptionActive::class);

        Route::get('propostas/{proposta}/documentos', [DocumentoController::class, 'index']);
        Route::post('propostas/{proposta}/documentos', [DocumentoController::class, 'store']);
        Route::post('propostas/{proposta}/documentos/auto-validate', [DocumentoController::class, 'autoValidate']);
        Route::get('propostas/{proposta}/pendencias', [PendenciaController::class, 'index']);
        Route::post('propostas/{proposta}/pendencias', [PendenciaController::class, 'store']);
        Route::patch('documentos/{documento}/validar', [DocumentoController::class, 'validar']);
        Route::patch('pendencias/{pendencia}/resolver', [PendenciaController::class, 'resolver']);
        Route::post('pendencias/{pendencia}/reabrir', [PendenciaController::class, 'reabrir']);
    });
});
