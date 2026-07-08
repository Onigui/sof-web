<?php

use App\Models\Pendencia;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pendencias', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->foreignId('proposta_id')->constrained('propostas')->cascadeOnDelete();
            $table->string('categoria');
            $table->text('comentario')->nullable();
            $table->enum('status', [Pendencia::STATUS_ABERTA, Pendencia::STATUS_RESOLVIDA]);
            $table->foreignId('criada_por')->constrained('users')->cascadeOnDelete();
            $table->dateTime('criada_em');
            $table->foreignId('resolvida_por')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('resolvida_em')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pendencias');
    }
};
