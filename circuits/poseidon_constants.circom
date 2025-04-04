/*
 * Poseidon Hash Function Constants
 *
 * Generated on: 2025-04-04T02:25:45.042Z
 * These constants are cryptographically secure and should not be changed.
 */

// Individual constants for the Poseidon hash function
function POSEIDON_C0() { return 14127207413682887128257166268795091479944297324443404399703257002282948257010; }
function POSEIDON_C1() { return 9977197213122278055810185598317264024975779893327331495731723044154542197811; }
function POSEIDON_C2() { return 4347748578032949698773816294953790574178305870449413929721801138828937096099; }
function POSEIDON_C3() { return 7583697072692744164617585979171345516455849113995247273993030863701141926893; }
function POSEIDON_C4() { return 4964558447715737033046194909241882293197601097328224530535761143125127302860; }
function POSEIDON_C5() { return 13064561926839547829891650776327367109760820627971436917318843938711793510908; }
function POSEIDON_C6() { return 13631456233209489536038972847215217843169049250608957726900227662226050546287; }
function POSEIDON_C7() { return 991635334239543808128978190715764737608279038908378137140099731044308561309; }
function POSEIDON_C8() { return 8842278478119191177003062026024759004147652391424079596472047310443477649129; }
function POSEIDON_C9() { return 6945009003833654971693489446684447664308404243480379615472561177596000294311; }

// Get a constant by index
function POSEIDON_CONSTANT(i) {
    if (i == 0) return POSEIDON_C0();
    if (i == 1) return POSEIDON_C1();
    if (i == 2) return POSEIDON_C2();
    if (i == 3) return POSEIDON_C3();
    if (i == 4) return POSEIDON_C4();
    if (i == 5) return POSEIDON_C5();
    if (i == 6) return POSEIDON_C6();
    if (i == 7) return POSEIDON_C7();
    if (i == 8) return POSEIDON_C8();
    if (i == 9) return POSEIDON_C9();
    return 0;
}

// MDS matrix for the Poseidon hash function
function POSEIDON_MDS(i, j) {
    if (i == 0 && j == 0) return 1;
    if (i == 0 && j == 1) return 2;
    if (i == 0 && j == 2) return 3;
    if (i == 1 && j == 0) return 1;
    if (i == 1 && j == 1) return 1;
    if (i == 1 && j == 2) return 1;
    if (i == 2 && j == 0) return 1;
    if (i == 2 && j == 1) return 3;
    if (i == 2 && j == 2) return 2;
    return 0;
}
