<?php

use App\Models\DetranQuery;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('detran_queries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->foreignId('proposta_id')->nullable()->constrained('propostas')->nullOnDelete();
            $table->string('placa')->nullable();
            $table->string('renavam')->nullable();
            $table->enum('status', [
                DetranQuery::STATUS_PENDENTE,
                DetranQuery::STATUS_EM_PROCESSO,
                DetranQuery::STATUS_CONCLUIDA,
                DetranQuery::STATUS_FALHOU,
                DetranQuery::STATUS_MANUAL,
            ]);
            $table->foreignId('requested_by')->constrained('users')->cascadeOnDelete();
            $table->dateTime('requested_at');
            $table->dateTime('processed_at')->nullable();
            $table->json('result_json')->nullable();
            $table->text('result_text')->nullable();
            $table->text('error')->nullable();
            $table->string('source')->default('MANUAL');
            $table->string('cache_key');
            $table->dateTime('cache_expires_at')->nullable();
            $table->timestamps();

            $table->index(['empresa_id', 'status']);
            $table->index(['empresa_id', 'proposta_id']);
            $table->index(['empresa_id', 'cache_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('detran_queries');
    }
};
