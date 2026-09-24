import csv
import json
import math
import os
from pathlib import Path


ROOT = Path(__file__).resolve().parent
STAMP = "2026-08-12T10:00:00-03:00"

ENRICHMENTS = {
    "4fd4dd30-68f1-4459-b374-4e4c59c678cc": {
        "empresa_contratante": "INTERLIGAÇÃO ELÉTRICA TIBAGI S.A.",
        "cnpj_contratante": "27.967.152/0001-14",
        "cnpj_contratante_limpo": "27967152000114",
        "cnpj_contratante_status": "VALIDADO_FONTE_OFICIAL",
        "dominio_contratante": "isaenergiabrasil.com.br",
        "holding_contratante_nome": "ISA ENERGIA BRASIL S.A.",
        "holding_contratante_cnpj": "02.998.611/0001-04",
        "empresa_executora": "ISA ENERGIA BRASIL S.A.",
        "cnpj_executora": "02.998.611/0001-04",
        "cnpj_executora_limpo": "02998611000104",
        "dominio_executora": "isaenergiabrasil.com.br",
        "executora_status": "VALIDADA_FONTE_OFICIAL_CONTROLADORA_EXECUTORA",
        "fornecedor_principal": "ISA ENERGIA BRASIL S.A.",
        "status_mapeamento_decisores": "MAPEADO_SEM_CONTATO_DIRETO",
        "total_decisores_mapeados": "2",
        "decisor_principal_nome": "Dayron Esteban Urrego Moreno",
        "decisor_principal_cargo": "Diretor Executivo de Projetos",
        "decisor_principal_tipo_cargo": "PROJETOS_ENGENHARIA",
        "decisor_principal_qualidade": "amarelo",
        "decisor_principal_confianca": "0.95",
        "obra_nivel1_nome": "Bruno Giacomini Isolani",
        "obra_nivel1_cargo": "Diretor Executivo de Operações",
        "decisores_total_contatos_relacional": "2",
        "decisores_contatos_verde": "0",
        "decisores_contatos_com_linkedin": "0",
        "decisores_contatos_com_telefone": "0",
        "decisores_contatos_com_email": "0",
        "decisores_resumo_estruturado": "Dayron Esteban Urrego Moreno | Diretor Executivo de Projetos | ISA Energia Brasil | fonte oficial; Bruno Giacomini Isolani | Diretor Executivo de Operações | ISA Energia Brasil | fonte oficial",
        "decisores_lista_completa": "Dayron Esteban Urrego Moreno — Diretor Executivo de Projetos; Bruno Giacomini Isolani — Diretor Executivo de Operações",
        "obra_nivel1_origem_enrichment": "web_oficial_isa_energia_2026-08-12",
        "status_enriquecimento": "ENRIQUECIDO_VALIDADO_FONTE_OFICIAL",
        "validacao_metodo": "web:demonstracoes_financeiras_2024+governanca_corporativa_2026",
        "ultimo_enrichment_at": STAMP,
        "ultimo_enrichment_status": "ENRICHED_SUCCESS_VALIDATED",
        "validacao_data": "2026-08-12",
        "status_marketplace_b2b": "5_BASE_GERAL_PROSPECCAO (Matches Prontos, Decisor Mapeado sem Contato Direto)",
    },
    "5ca6496d-fb83-4065-84bf-6d64896b6622": {
        "cnpj_contratante": "28.008.699/0001-55",
        "cnpj_contratante_limpo": "28008699000155",
        "cnpj_contratante_status": "VALIDADO_FONTE_OFICIAL",
        "dominio_contratante": "tsmenergia.com.br",
        "holding_contratante_nome": "ALUPAR INVESTIMENTO S.A.",
        "empresa_executora": "TSM - TRANSMISSORA SERRA DA MANTIQUEIRA S.A.",
        "cnpj_executora": "28.008.699/0001-55",
        "cnpj_executora_limpo": "28008699000155",
        "dominio_executora": "tsmenergia.com.br",
        "executora_status": "VALIDADA_FONTE_OFICIAL_AUTOCONSTRUCAO_CONCESSIONARIA",
        "fornecedor_principal": "TSM - TRANSMISSORA SERRA DA MANTIQUEIRA S.A.",
        "status_mapeamento_decisores": "MAPEADO_COM_CANAL_CORPORATIVO",
        "total_decisores_mapeados": "1",
        "decisor_principal_nome": "Paulo Roberto de Godoy Pereira",
        "decisor_principal_cargo": "Diretor-Presidente da Alupar",
        "decisor_principal_tipo_cargo": "DIRETORIA_EXECUTIVA_CONTROLADORA",
        "decisor_principal_qualidade": "amarelo",
        "decisor_principal_confianca": "0.85",
        "decisor_principal_email": "contato.transmissoras@alupar.com.br",
        "decisor_principal_telefone": "(11) 4571-2400",
        "decisores_total_contatos_relacional": "1",
        "decisores_contatos_verde": "0",
        "decisores_contatos_com_linkedin": "0",
        "decisores_contatos_com_telefone": "1",
        "decisores_contatos_com_email": "1",
        "decisores_resumo_estruturado": "Paulo Roberto de Godoy Pereira | Diretor-Presidente da Alupar | canal corporativo oficial contato.transmissoras@alupar.com.br | (11) 4571-2400",
        "decisores_lista_completa": "Paulo Roberto de Godoy Pereira — Diretor-Presidente da Alupar — canal corporativo oficial",
        "obra_nivel1_origem_enrichment": "web_oficial_tsm_alupar_2026-08-12",
        "status_enriquecimento": "ENRIQUECIDO_VALIDADO_FONTE_OFICIAL",
        "validacao_metodo": "web:tsm_oficial+demonstracoes_societarias+ri_alupar",
        "ultimo_enrichment_at": STAMP,
        "ultimo_enrichment_status": "ENRICHED_SUCCESS_VALIDATED",
        "validacao_data": "2026-08-12",
        "status_marketplace_b2b": "5_BASE_GERAL_PROSPECCAO (Matches Prontos, Decisor Mapeado sem Contato Direto)",
    },
}


def update_csv(path: Path, remove_enriched: bool = False) -> tuple[int, int]:
    with path.open("r", encoding="utf-8-sig", newline="") as src:
        reader = csv.DictReader(src)
        fields = reader.fieldnames or []
        rows = list(reader)
    updated = removed = 0
    output = []
    for row in rows:
        oid = row.get("obra_id")
        if oid in ENRICHMENTS and remove_enriched:
            removed += 1
            continue
        if oid in ENRICHMENTS:
            for key, value in ENRICHMENTS[oid].items():
                if key in fields:
                    row[key] = value
            updated += 1
        output.append(row)
    temp = path.with_suffix(path.suffix + ".tmp")
    with temp.open("w", encoding="utf-8-sig", newline="") as dst:
        writer = csv.DictWriter(dst, fieldnames=fields)
        writer.writeheader()
        writer.writerows(output)
    os.replace(temp, path)
    return updated, removed


def update_json(path: Path) -> int:
    def constant(value):
        return math.nan if value == "NaN" else value

    with path.open("r", encoding="utf-8") as src:
        rows = json.load(src, parse_constant=constant)
    updated = 0
    for row in rows:
        values = ENRICHMENTS.get(row.get("obra_id"))
        if values:
            for key, value in values.items():
                if key in row:
                    row[key] = value
            updated += 1
    # JSON.parse() dos navegadores rejeita NaN/Infinity. Convertemos todos os
    # valores não finitos em null antes de publicar o arquivo da aplicação.
    for row in rows:
        for key, value in row.items():
            if isinstance(value, float) and not math.isfinite(value):
                row[key] = None
    temp = path.with_suffix(path.suffix + ".tmp")
    with temp.open("w", encoding="utf-8") as dst:
        json.dump(rows, dst, ensure_ascii=False, indent=2, allow_nan=False)
    os.replace(temp, path)
    return updated


if __name__ == "__main__":
    targets = [
        ROOT / "obras_sp_ecossistema_unificado_360.csv",
        ROOT / "obras_sp_todas_obras_ciclo_completo.csv",
    ]
    for target in targets:
        updated, _ = update_csv(target)
        print(f"{target.name}: {updated} registros atualizados")
    queue = ROOT / "obras_sp_para_enriquecimento_priorizado.csv"
    _, removed = update_csv(queue, remove_enriched=True)
    print(f"{queue.name}: {removed} registros concluídos removidos da fila")
    print(f"data/obras_data.json: {update_json(ROOT / 'data' / 'obras_data.json')} registros atualizados")
