from gradesync.refresh import Plan, plan, term_key


def test_term_order():
    assert sorted(["2025/2", "2027/1", "2026/2", "2026/1"], key=term_key) == [
        "2025/2",
        "2026/1",
        "2026/2",
        "2027/1",
    ]


def test_keeps_the_current_term_fresh():
    assert plan("2026/2", ["2026/2", "2026/1"]) == Plan(newer=None, current="2026/2")


def test_tries_a_newly_published_term():
    assert plan("2026/2", ["2027/1", "2026/2", "2026/1"]) == Plan(newer="2027/1", current="2026/2")


def test_first_load_picks_the_newest_term():
    assert plan(None, ["2026/1", "2026/2"]) == Plan(newer="2026/2", current=None)


def test_a_current_term_no_longer_offered_has_nothing_to_refresh():
    assert plan("2024/1", ["2026/2"]) == Plan(newer="2026/2", current=None)
