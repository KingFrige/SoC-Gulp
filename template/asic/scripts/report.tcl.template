check_design  > ${reportDir}/check_design_syn.rpt
report_design > ${reportDir}/design.rpt
report_cell   > ${reportDir}/cell.rpt
report_reference > ${reportDir}/reference.rpt
report_port -verbose > ${reportDir}/port.rpt
report_net > ${reportDir}/net.rpt
report_compile_options > ${reportDir}/compile_options.rpt

report_clock         > ${reportDir}/clk.rpt
report_clock -skew   >> ${reportDir}/clk.rpt
report_clock -groups >> ${reportDir}/clk.rpt
report_clock_gating -verbose > ${reportDir}/clock_gating.rpt
report_clock_gating -ungated >> ${reportDir}/clock_gating.rpt

report_timing -tran -cap -net  -max_paths 10 -nworst 10 >  ${reportDir}/timing_max.rpt
report_constraint -all_violators -verbose > ${reportDir}/constraint_verbose.rpt
report_transitive_fanout -clock_tree > ${reportDir}/transitive_fanout.rpt
report_area -hierarchy > ${reportDir}/area.rpt
report_power -v -hierarchy > ${reportDir}/power.rpt
report_qor > ${reportDir}/qor.rpt
report_resource -hierarchy   > ${reportDir}/resource.rpt
report_dont_touch -class net > ${reportDir}/net_dtouch.rpt
