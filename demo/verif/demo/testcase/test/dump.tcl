call fsdbDumpfile {"dump.fsdb"}
# call fsdbDumpvars 0 bench_top {"+skip_cell_instance=1"}
call fsdbDumpvars 0 {"+skip_cell_instance=1"}
# database -vcd dump
# probe bench_top.u0_dut -all -depth all
