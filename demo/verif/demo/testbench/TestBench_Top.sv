`timescale 1 ns / 1 ps

module bench_top;
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
    @(posedge clk)   a = 4'b1111; b = 4'b1111; ci = 0; 
    @(posedge clk)   a = 4'b1100; b = 4'b1001; ci = 0; 
    @(posedge clk)   a = 4'b0111; b = 4'b0110; ci = 0; 
    @(posedge clk)   a = 4'b0101; b = 4'b0101; ci = 1; 
    @(posedge clk)   a = 4'b1110; b = 4'b1001; ci = 1; 
    @(posedge clk)   a = 4'b0010; b = 4'b0110; ci = 1; 
    @(posedge clk)   a = 4'b0110; b = 4'b1101; ci = 1; 
    @(posedge clk)   a = 4'b1110; b = 4'b1110; ci = 1; 
    @(posedge clk)   a = 4'b1100; b = 4'b0110; ci = 1; 
    @(posedge clk)   a = 4'b1100; b = 4'b0101; ci = 1; 
    @(posedge clk)   a = 4'b0011; b = 4'b1010; ci = 1; 
    @(posedge clk)   $finish;
end

always #5  clk = ~clk;

initial begin
  $fsdbDumpfile("test.fsdb");
  $fsdbDumpvars();
end

pipeliningadder u_pipeliningadder(
                                              .s(s),
                                              .co(co),
                                              .a(a),
                                              .b(b),
                                              .ci(ci),
                                              .clk(clk),
                                              .rstn(rstn)
                                              );

                                              endmodule
