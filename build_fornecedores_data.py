import csv
import json
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "data" / "fornecedores"
OUT.mkdir(parents=True, exist_ok=True)

def clean_cnpj(value):
    return "".join(ch for ch in str(value or "") if ch.isdigit())

with (ROOT / "fornecedores_sp_catalogo_completo_consolidado.csv").open(encoding="utf-8-sig", newline="") as f:
    catalog = list(csv.DictReader(f))

matches = defaultdict(list)
seen_matches = set()
with (ROOT / "fornecedores_sp_matches_todos_obras_completo.csv").open(encoding="utf-8-sig", newline="") as f:
    for row in csv.DictReader(f):
        cnpj = clean_cnpj(row.get("fornecedor_cnpj"))
        if cnpj:
            seen_matches.add((cnpj, row.get("obra_id", "")))
            matches[cnpj].append({
                "obra_id": row.get("obra_id", ""),
                "obra_nome": row.get("obra_nome", ""),
                "setor_obra": row.get("setor_obra", ""),
                "municipio_obra": row.get("municipio_obra", ""),
                "capex_obra_brl": row.get("capex_obra_brl", ""),
                "tipo_fornecimento": row.get("tipo_fornecimento", ""),
                "score_compatibilidade": row.get("score_compatibilidade", ""),
            })

# A base homologada contém alguns vínculos que não aparecem no arquivo geral.
with (ROOT / "fornecedores_sp_matches_homologados_obras.csv").open(encoding="utf-8-sig", newline="") as f:
    for row in csv.DictReader(f):
        cnpj = clean_cnpj(row.get("fornecedor_cnpj_limpo") or row.get("fornecedor_cnpj"))
        key = (cnpj, row.get("obra_id", ""))
        if cnpj and key not in seen_matches:
            seen_matches.add(key)
            matches[cnpj].append({
                "obra_id": row.get("obra_id", ""),
                "obra_nome": row.get("obra_nome", ""),
                "setor_obra": row.get("cnae_divisao_insumo", ""),
                "municipio_obra": row.get("obra_municipio", ""),
                "capex_obra_brl": row.get("obra_capex_brl", ""),
                "tipo_fornecimento": "MATCH HOMOLOGADO",
                "score_compatibilidade": row.get("score_compatibilidade", ""),
            })

buckets = defaultdict(list)
index = []
for row in catalog:
    cnpj = clean_cnpj(row.get("cnpj_limpo") or row.get("cnpj"))
    if not cnpj:
        continue
    row["cnpj_limpo"] = cnpj
    row["matches_obras"] = sorted(matches.get(cnpj, []), key=lambda x: float(x.get("score_compatibilidade") or 0), reverse=True)
    bucket = cnpj[:2]
    buckets[bucket].append(row)
    index.append({
        "cnpj": cnpj,
        "cnpj_formatado": row.get("cnpj", ""),
        "razao_social": row.get("razao_social", ""),
        "nome_fantasia": row.get("nome_fantasia", ""),
        "macro_categoria": row.get("macro_categoria", ""),
        "especialidade_tecnica": row.get("especialidade_tecnica", ""),
        "municipio": row.get("municipio", ""),
        "uf": row.get("uf", ""),
        "porte": row.get("porte", ""),
        "capital_social_formatado": row.get("capital_social_formatado", ""),
        "quantidade_matches_obras": row.get("quantidade_matches_obras", "0"),
        "email_contato": row.get("email_contato", ""),
        "telefone_principal": row.get("telefone_principal", ""),
    })

with (OUT / "index.json").open("w", encoding="utf-8") as f:
    json.dump(index, f, ensure_ascii=False, separators=(",", ":"), allow_nan=False)
for bucket, rows in buckets.items():
    with (OUT / f"{bucket}.json").open("w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, separators=(",", ":"), allow_nan=False)

print(f"{len(index)} fornecedores; {sum(len(v) for v in matches.values())} matches; {len(buckets)} arquivos de detalhe")
