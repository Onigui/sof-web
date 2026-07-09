<?php

namespace App\Providers;

use App\Models\AuditLog;
use App\Models\DetranQuery;
use App\Models\Documento;
use App\Models\Lead;
use App\Models\Pendencia;
use App\Models\Proposta;
use App\Models\Regiao;
use App\Models\RelatorioRun;
use App\Policies\AuditPolicy;
use App\Policies\DetranQueryPolicy;
use App\Policies\DocumentoPolicy;
use App\Policies\LeadPolicy;
use App\Policies\PendenciaPolicy;
use App\Policies\PropostaPolicy;
use App\Policies\RegiaoPolicy;
use App\Policies\RelatorioRunPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }

        Gate::policy(AuditLog::class, AuditPolicy::class);
        Gate::policy(DetranQuery::class, DetranQueryPolicy::class);
        Gate::policy(Documento::class, DocumentoPolicy::class);
        Gate::policy(Lead::class, LeadPolicy::class);
        Gate::policy(Pendencia::class, PendenciaPolicy::class);
        Gate::policy(Proposta::class, PropostaPolicy::class);
        Gate::policy(Regiao::class, RegiaoPolicy::class);
        Gate::policy(RelatorioRun::class, RelatorioRunPolicy::class);
    }
}
