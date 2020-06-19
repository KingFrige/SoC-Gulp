module  bench_top;
wire      [3:0]       s;
wire                  co;
reg       [3:0]       a;
reg       [3:0]       b;
reg                   ci;

reg                   clk;
reg                   rstn;

initial
begin
  clk   = 0;
  rstn  = 0;
  @(posedge clk)   rstn = 1;

  a = 4'b0000; b = 4'b0000; ci = 0; 
  @(posedge clk)   a = 4'd9; b = 4'd15; ci = 0; 
  @(posedge clk)   a = 4'd8; b = 4'd14; ci = 0; 
  @(posedge clk)   a = 4'd7; b = 4'd13; ci = 0; 
  @(posedge clk)   a = 4'd6; b = 4'd12; ci = 1; 
  @(posedge clk)   a = 4'd5; b = 4'd11; ci = 1; 
  $display("expect = 24, result = %d", {co,s});
  @(posedge clk)   a = 4'd4; b = 4'd10; ci = 1; 
  $display("expect = 22, result = %d", {co, s});
  @(posedge clk)   a = 4'd3; b = 4'd9; ci = 1; 
  $display("expect = 20, result = %d", {co, s});
  @(posedge clk)   a = 4'd2; b = 4'd8; ci = 1; 
  $display("expect = 18, result = %d", {co, s});
  @(posedge clk) 
  $display("expect = 17, result = %d", {co, s});
  @(posedge clk)
  $display("expect = 15, result = %d", {co, s});
  @(posedge clk)
  $display("expect = 13, result = %d", {co, s});
  @(posedge clk)
  $display("expect = 11, result = %d", {co, s});
  @(posedge clk)   $finish;
end

always #5  clk = ~clk;

initial begin
  $dumpfile("dump.vcd");
  $dumpvars;
end

pipeLiningAdder u_pipeLiningAdder(
  .s(s),
  .co(co),
  .a(a),
  .b(b),
  .ci(ci),
  .clk(clk),
  .rstn(rstn)
);

endmodule
