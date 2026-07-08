<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('requirement_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->foreignId('banco_id')->nullable()->constrained('bancos')->nullOnDelete();
            $table->foreignId('produto_id')->nullable()->constrained('produtos')->nullOnDelete();
            $table->json('required_fields')->nullable();
            $table->json('required_docs')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->index(['empresa_id', 'banco_id', 'produto_id']);
            $table->index(['empresa_id', 'active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('requirement_rules');
    }
};
