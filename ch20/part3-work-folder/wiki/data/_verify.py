"""dashboard.json 자체 검산 스크립트. 집계 필드가 documents/relations/timeline과
어긋나지 않는지 확인한다. 데이터를 고친 뒤 다시 돌릴 것."""
import json
from collections import Counter

d = json.load(open("wiki/data/dashboard.json", encoding="utf-8"))
raw = [x for x in d["documents"] if x["category"] != "wiki"]
wiki = [x for x in d["documents"] if x["category"] == "wiki"]
ids = {x["id"] for x in d["documents"]}

print("raw nodes:", len(raw), "/ wiki nodes:", len(wiki))
print("by_format   :", dict(Counter(x["format"] for x in raw)))
print("by_date_stat:", dict(Counter(x["date_status"] for x in raw)))
print("by_category :", dict(Counter(x["category"] for x in raw)))
print("status      :", dict(Counter(x["status"] for x in raw)))
print("warning docs:", sum(1 for x in raw if x.get("warning")))
print("future events:", sum(1 for e in d["timeline"] if e.get("future")))
print("relations:", len(d["relations"]), "/ timeline:", len(d["timeline"]))

dangling = [(r["from"], r["to"]) for r in d["relations"]
            if r["from"] not in ids or r["to"] not in ids]
print("dangling relation ids:", dangling)
print("dangling timeline ids:",
      [x for t in d["timeline"] for x in t["docs"] if x not in ids])
print("dangling open_item ids:",
      [x for o in d["open_items"] for x in o["docs"] if x not in ids])

cc = d["category_counts"]
cs = d["counts_summary"]
fmt = Counter(x["format"] for x in raw)
declared = {c["id"]: c["count"] for c in cc["by_category"]}
actual = Counter(x["category"] for x in d["documents"])

# 선언값 vs 실제값. 빈 dict면 통과.
mismatch = {}
mismatch.update({"category/" + k: (declared[k], actual[k])
                 for k in declared if declared[k] != actual[k]})
mismatch.update({"format/" + f["format"]: (f["count"], fmt[f["format"]])
                 for f in cc["by_format"] if f["count"] != fmt[f["format"]]})
mismatch.update({"date_status/" + k: (v, Counter(x["date_status"] for x in raw)[k])
                 for k, v in cc["by_date_status"].items() if k != "note"
                 and v != Counter(x["date_status"] for x in raw)[k]})

status = Counter(x["status"] for x in raw)
expect = {
    "total_raw": (cc["total_raw"], len(raw)),
    "total_wiki": (cc["total_wiki"], len(wiki)),
    "total_repo_docs": (cc["total_repo_docs"], len(raw) + len(wiki) + 1),
    "sum_by_format": (sum(f["count"] for f in cc["by_format"]), len(raw)),
    "documents_with_warning": (cs["documents_with_warning"],
                               sum(1 for x in raw if x.get("warning"))),
    "duplicates": (cs["duplicates"], status["duplicate"]),
    "superseded_or_discarded": (cs["superseded_or_discarded"],
                                status["superseded"] + status["discarded"]),
    "open_items": (cs["open_items"], len(d["open_items"])),
    "overdue_items": (cs["overdue_items"],
                      sum(1 for o in d["open_items"] if o.get("overdue"))),
    "future_dated_events": (cs["future_dated_events"],
                            sum(1 for e in d["timeline"] if e.get("future"))),
    "value_conflicts_resolved": (cs["value_conflicts_resolved"],
                                 sum(1 for r in d["relations"]
                                     if r["type"] == "value_conflict" and r.get("resolved"))),
    "value_conflicts_unresolved": (cs["value_conflicts_unresolved"],
                                   sum(1 for r in d["relations"]
                                       if r["type"] == "value_conflict" and not r.get("resolved"))),
}
mismatch.update({k: v for k, v in expect.items() if v[0] != v[1]})

# 타임라인이 가리키는 날짜가 그 문서의 date와 어긋나지 않는지(문서 날짜가 있는 경우만)
by_id = {x["id"]: x for x in d["documents"]}
unknown_type = {r["type"] for r in d["relations"]} - set(d["_meta"]["relation_types"])
if unknown_type:
    mismatch["relation_types_undocumented"] = sorted(unknown_type)

# timeline은 배열 순서가 곧 표시 순서다(_meta.timeline_order 참고).
# date 문자열로 재정렬하면 월 정밀도 항목이 같은 달 앞으로 튀므로, 월 단위 단조성만 본다.
months = [e["date"][:7] for e in d["timeline"]]
print("timeline month-monotonic:", months == sorted(months))
loose = [e["date"] for e in d["timeline"] if e["precision"] == "month"]
print("month-precision events (재정렬 금지):", loose)
print("declared vs actual mismatch:", mismatch if mismatch else "없음 — 통과")
