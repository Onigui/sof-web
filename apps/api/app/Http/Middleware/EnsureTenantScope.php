<?php

namespace App\Http\Middleware;

use App\Models\Scopes\EmpresaScope;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantScope
{
    public function handle(Request $request, Closure $next): Response
    {
        EmpresaScope::setEmpresaId($request->user()?->empresa_id);

        try {
            return $next($request);
        } finally {
            EmpresaScope::clear();
        }
    }
}
