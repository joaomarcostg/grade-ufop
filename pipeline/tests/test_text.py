import pytest

from gradesync.text import build_lexicon, display_name, fold

LEXICON = build_lexicon(
    [
        "Programação estruturada. Introdução à computação e à prática de algoritmos.",
        "Interação humano-computador, análise e avaliação de interfaces.",
        "A prática docente; a prática clínica; praticar é preciso. pratica",
        "CIÊNCIA DA COMPUTAÇÃO",
    ]
)


def test_fold():
    assert fold("Programação") == "PROGRAMACAO"


def test_lexicon_prefers_the_most_frequent_spelling():
    assert LEXICON["PRATICA"] == "prática"
    assert LEXICON["CIENCIA"] == "ciência"  # learned from an all-caps accented title


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("PROGRAMACAO DE COMPUTADORES I", "Programação de Computadores I"),
        ("INTERACAO HUMANO-COMPUTADOR", "Interação Humano-Computador"),
        ("INTRODUCAO A COMPUTACAO", "Introdução a Computação"),
        ("TRABALHO DE CONCLUSAO DE CURSO II", "Trabalho de Conclusão de Curso II"),
        ("SEMINARIO VII: PRATICA", "Seminario VII: Prática"),
        ("TOPICOS EM SQL E TCC", "Topicos em SQL e TCC"),
        ("A PRATICA", "A Prática"),
        ("GESTAO DE ORGANIZACOES", "Gestão de Organizações"),
    ],
)
def test_display_name(raw, expected):
    assert display_name(raw, LEXICON) == expected


def test_lexicon_does_not_depend_on_text_order():
    texts = ["Prática e pratica", "pratica e Prática"]
    assert build_lexicon(texts) == build_lexicon(list(reversed(texts)))
