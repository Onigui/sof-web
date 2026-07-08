<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Produto;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProdutoController extends Controller
{
    public function index(): JsonResponse
    {
        $items = Produto::query()->orderBy('name')->get()->map(fn (Produto $produto) => [
            'id' => $produto->id,
            'nome' => $produto->name,
            'ativo' => (bool) ($produto->ativo ?? true),
        ]);

        return response()->json(['data' => $items]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nome' => ['required', 'string', 'max:255'],
            'ativo' => ['nullable', 'boolean'],
        ]);

        $produto = Produto::create([
            'name' => $validated['nome'],
            'ativo' => $validated['ativo'] ?? true,
        ]);

        return response()->json([
            'data' => [
                'id' => $produto->id,
                'nome' => $produto->name,
                'ativo' => (bool) $produto->ativo,
            ],
        ], 201);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id' => ['required', 'integer', 'exists:produtos,id'],
            'nome' => ['sometimes', 'string', 'max:255'],
            'ativo' => ['sometimes', 'boolean'],
        ]);

        $produto = Produto::query()->findOrFail($validated['id']);

        if (array_key_exists('nome', $validated)) {
            $produto->name = $validated['nome'];
        }
        if (array_key_exists('ativo', $validated)) {
            $produto->ativo = $validated['ativo'];
        }
        $produto->save();

        return response()->json([
            'data' => [
                'id' => $produto->id,
                'nome' => $produto->name,
                'ativo' => (bool) $produto->ativo,
            ],
        ]);
    }
}
