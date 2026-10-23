# 271 — hashed wide-box memo (2^16 direct-mapped), A/B vs repo kernel

Patch: docs/research/patches/271-hashed-wide-memo.patch

```
repo: raise-kernel.json IDENTICAL (1430 answers, 6 boxes > MEMO_CAP, 9416 ms); raise.json IDENTICAL (73 stops, 132699 ms)
patched: raise-kernel.json IDENTICAL (1430 answers, 6 boxes > MEMO_CAP, 10062 ms); raise.json IDENTICAL (73 stops, 128108 ms)
== 2^14
acct ★1 burn-saver: 103 shapes, identical 103, differ 0 | repo 96874 ms, patched 86500 ms (×1.12)
acct ★1 silver-saver: 21 shapes, identical 21, differ 0 | repo 5989 ms, patched 3994 ms (×1.50)
acct ★1 sweet-spot: 48 shapes, identical 48, differ 0 | repo 5087 ms, patched 3926 ms (×1.30)
== 2^16
acct ★1 burn-saver: 103 shapes, identical 103, differ 0 | repo 86753 ms, patched 72397 ms (×1.20)
acct ★1 silver-saver: 21 shapes, identical 21, differ 0 | repo 5874 ms, patched 3430 ms (×1.71)
acct ★1 sweet-spot: 48 shapes, identical 48, differ 0 | repo 5011 ms, patched 3678 ms (×1.36)
== 2^18
acct ★1 burn-saver: 103 shapes, identical 103, differ 0 | repo 88259 ms, patched 78493 ms (×1.12)
acct ★1 silver-saver: 21 shapes, identical 21, differ 0 | repo 5942 ms, patched 3303 ms (×1.80)
acct ★1 sweet-spot: 48 shapes, identical 48, differ 0 | repo 4995 ms, patched 3728 ms (×1.34)
== 2^16 diagnostic (hits/misses)
acct ★1 burn-saver: 103 shapes, identical 0, differ 103 | repo 96088 ms, patched 82394 ms (×1.17) | wide-box hits 92050978 misses 336042208
acct ★1 silver-saver: 21 shapes, identical 0, differ 21 | repo 6370 ms, patched 3788 ms (×1.68) | wide-box hits 4764238 misses 1367595
acct ★1 sweet-spot: 48 shapes, identical 0, differ 48 | repo 5503 ms, patched 4188 ms (×1.31) | wide-box hits 2546626 misses 418670
== 2^21 open addressing, fill-stop
acct ★1 burn-saver: 103 shapes, identical 103, differ 0 | repo 91078 ms, patched 111209 ms (×0.82)
acct ★1 silver-saver: 21 shapes, identical 21, differ 0 | repo 6156 ms, patched 3636 ms (×1.69)
acct ★1 sweet-spot: 48 shapes, identical 48, differ 0 | repo 5184 ms, patched 3889 ms (×1.33)
```
