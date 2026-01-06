import { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileSpreadsheet, BarChart3, Download, Trash2, TrendingUp, Calculator, Atom } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ScatterChart, Scatter, Legend, AreaChart, Area } from 'recharts';
import { toast } from 'sonner';

interface DataRow {
  [key: string]: string | number;
}

interface ColumnStats {
  name: string;
  type: 'number' | 'string';
  min?: number;
  max?: number;
  mean?: number;
  stdDev?: number;
  count: number;
  unique: number;
}

interface QuantumMetrics {
  fidelity?: number;
  purity?: number;
  entropy?: number;
  t1?: number;
  t2?: number;
  errorRate?: number;
}

const DataAnalysis = () => {
  const [data, setData] = useState<DataRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [stats, setStats] = useState<ColumnStats[]>([]);
  const [quantumMetrics, setQuantumMetrics] = useState<QuantumMetrics>({});
  const [chartType, setChartType] = useState<'line' | 'bar' | 'scatter' | 'area'>('line');
  const [xAxis, setXAxis] = useState<string>('');
  const [yAxis, setYAxis] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  const calculateStats = useCallback((data: DataRow[], cols: string[]): ColumnStats[] => {
    return cols.map(col => {
      const values = data.map(row => row[col]);
      const numericValues = values.filter(v => typeof v === 'number' || !isNaN(Number(v))).map(v => Number(v));
      const isNumeric = numericValues.length > values.length * 0.5;

      if (isNumeric && numericValues.length > 0) {
        const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
        const variance = numericValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / numericValues.length;
        return {
          name: col,
          type: 'number',
          min: Math.min(...numericValues),
          max: Math.max(...numericValues),
          mean: mean,
          stdDev: Math.sqrt(variance),
          count: values.length,
          unique: new Set(values).size
        };
      }
      return {
        name: col,
        type: 'string',
        count: values.length,
        unique: new Set(values).size
      };
    });
  }, []);

  const calculateQuantumMetrics = useCallback((data: DataRow[], cols: string[]): QuantumMetrics => {
    const metrics: QuantumMetrics = {};
    const lowerCols = cols.map(c => c.toLowerCase());
    
    // Auto-detect quantum-related columns
    const fidelityCol = cols.find((_, i) => lowerCols[i].includes('fidelity') || lowerCols[i].includes('fid'));
    const errorCol = cols.find((_, i) => lowerCols[i].includes('error') || lowerCols[i].includes('err'));
    const t1Col = cols.find((_, i) => lowerCols[i] === 't1' || lowerCols[i].includes('t1_'));
    const t2Col = cols.find((_, i) => lowerCols[i] === 't2' || lowerCols[i].includes('t2_'));
    const purityCol = cols.find((_, i) => lowerCols[i].includes('purity'));
    
    if (fidelityCol) {
      const values = data.map(r => Number(r[fidelityCol])).filter(v => !isNaN(v));
      metrics.fidelity = values.reduce((a, b) => a + b, 0) / values.length;
    }
    if (errorCol) {
      const values = data.map(r => Number(r[errorCol])).filter(v => !isNaN(v));
      metrics.errorRate = values.reduce((a, b) => a + b, 0) / values.length;
    }
    if (t1Col) {
      const values = data.map(r => Number(r[t1Col])).filter(v => !isNaN(v));
      metrics.t1 = values.reduce((a, b) => a + b, 0) / values.length;
    }
    if (t2Col) {
      const values = data.map(r => Number(r[t2Col])).filter(v => !isNaN(v));
      metrics.t2 = values.reduce((a, b) => a + b, 0) / values.length;
    }
    if (purityCol) {
      const values = data.map(r => Number(r[purityCol])).filter(v => !isNaN(v));
      metrics.purity = values.reduce((a, b) => a + b, 0) / values.length;
    }
    
    // Calculate entropy if we have probability columns
    const probCols = cols.filter((_, i) => lowerCols[i].includes('prob') || lowerCols[i].includes('p_'));
    if (probCols.length > 0) {
      const avgProbs = probCols.map(col => {
        const values = data.map(r => Number(r[col])).filter(v => !isNaN(v) && v > 0);
        return values.reduce((a, b) => a + b, 0) / values.length;
      });
      const totalProb = avgProbs.reduce((a, b) => a + b, 0);
      if (totalProb > 0) {
        metrics.entropy = -avgProbs.reduce((sum, p) => {
          const normalized = p / totalProb;
          return sum + (normalized > 0 ? normalized * Math.log2(normalized) : 0);
        }, 0);
      }
    }
    
    return metrics;
  }, []);

  const parseCSV = (text: string): { data: DataRow[]; columns: string[] } => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return { data: [], columns: [] };
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const row: DataRow = {};
      headers.forEach((h, i) => {
        const val = values[i] || '';
        row[h] = isNaN(Number(val)) || val === '' ? val : Number(val);
      });
      return row;
    });
    
    return { data: rows, columns: headers };
  };

  const parseJSON = (text: string): { data: DataRow[]; columns: string[] } => {
    try {
      const parsed = JSON.parse(text);
      const arr = Array.isArray(parsed) ? parsed : parsed.data || [parsed];
      if (arr.length === 0) return { data: [], columns: [] };
      const cols = Object.keys(arr[0]);
      return { data: arr, columns: cols };
    } catch {
      return { data: [], columns: [] };
    }
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      let result: { data: DataRow[]; columns: string[] };
      
      if (file.name.endsWith('.json')) {
        result = parseJSON(text);
      } else {
        result = parseCSV(text);
      }
      
      if (result.data.length === 0) {
        toast.error('Could not parse file. Please check the format.');
        return;
      }
      
      setData(result.data);
      setColumns(result.columns);
      setFileName(file.name);
      setStats(calculateStats(result.data, result.columns));
      setQuantumMetrics(calculateQuantumMetrics(result.data, result.columns));
      
      const numericCols = result.columns.filter(col => {
        const vals = result.data.map(r => r[col]);
        return vals.some(v => typeof v === 'number' || !isNaN(Number(v)));
      });
      if (numericCols.length >= 2) {
        setXAxis(numericCols[0]);
        setYAxis(numericCols[1]);
      } else if (numericCols.length === 1) {
        setXAxis('index');
        setYAxis(numericCols[0]);
      }
      
      toast.success(`Loaded ${result.data.length} rows from ${file.name}`);
    };
    reader.readAsText(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.json'))) {
      handleFileUpload(file);
    } else {
      toast.error('Please upload a CSV or JSON file');
    }
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const exportData = () => {
    const exportObj = {
      fileName,
      statistics: stats,
      quantumMetrics,
      data: data.slice(0, 100)
    };
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis_${fileName.replace(/\.[^/.]+$/, '')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Analysis exported');
  };

  const clearData = () => {
    setData([]);
    setColumns([]);
    setFileName('');
    setStats([]);
    setQuantumMetrics({});
    setXAxis('');
    setYAxis('');
  };

  const chartData = data.map((row, i) => ({
    ...row,
    index: i
  }));

  const numericColumns = stats.filter(s => s.type === 'number').map(s => s.name);

  const renderChart = () => {
    if (!xAxis || !yAxis || chartData.length === 0) return null;
    
    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 20 }
    };

    switch (chartType) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey={xAxis} stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
            <Legend />
            <Bar dataKey={yAxis} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey={xAxis} stroke="hsl(var(--muted-foreground))" fontSize={12} name={xAxis} />
            <YAxis dataKey={yAxis} stroke="hsl(var(--muted-foreground))" fontSize={12} name={yAxis} />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
            <Legend />
            <Scatter name="Data" data={chartData} fill="hsl(var(--primary))" />
          </ScatterChart>
        );
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey={xAxis} stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
            <Legend />
            <Area type="monotone" dataKey={yAxis} stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.3)" />
          </AreaChart>
        );
      default:
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey={xAxis} stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
            <Legend />
            <Line type="monotone" dataKey={yAxis} stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
          </LineChart>
        );
    }
  };

  return (
    <>
      <Helmet>
        <title>Data Analysis | QuantumNoise</title>
        <meta name="description" content="Upload and analyze quantum experiment data with interactive visualizations, statistical analysis, and quantum-specific metrics." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <main className="container mx-auto px-4 pt-24 pb-16">
          <div className="max-w-7xl mx-auto">
            <header className="text-center mb-12">
              <Badge variant="outline" className="mb-4">Data Analysis</Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
                Quantum Data <span className="text-primary">Analyzer</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Upload your quantum experiment data for visualization, statistical analysis, and quantum-specific metrics calculation.
              </p>
            </header>

            {data.length === 0 ? (
              <Card className="max-w-2xl mx-auto glass border-primary/20">
                <CardContent className="p-12">
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                      isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Upload className="w-16 h-16 mx-auto mb-6 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2 text-foreground">Upload Your Data</h3>
                    <p className="text-muted-foreground mb-6">
                      Drag and drop a CSV or JSON file, or click to browse
                    </p>
                    <input
                      type="file"
                      accept=".csv,.json"
                      onChange={handleFileInput}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload">
                      <Button asChild>
                        <span className="cursor-pointer">
                          <FileSpreadsheet className="w-4 h-4 mr-2" />
                          Select File
                        </span>
                      </Button>
                    </label>
                    <p className="text-xs text-muted-foreground mt-4">
                      Supports CSV and JSON formats
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Header Actions */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-5 h-5 text-primary" />
                    <span className="font-medium text-foreground">{fileName}</span>
                    <Badge variant="secondary">{data.length} rows</Badge>
                    <Badge variant="outline">{columns.length} columns</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={exportData}>
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                    <Button variant="destructive" size="sm" onClick={clearData}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                  </div>
                </div>

                {/* Quantum Metrics */}
                {Object.keys(quantumMetrics).length > 0 && (
                  <Card className="glass border-primary/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-foreground">
                        <Atom className="w-5 h-5 text-primary" />
                        Quantum Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {quantumMetrics.fidelity !== undefined && (
                          <div className="p-4 rounded-lg bg-muted/50 text-center">
                            <div className="text-2xl font-bold text-primary">{(quantumMetrics.fidelity * 100).toFixed(2)}%</div>
                            <div className="text-sm text-muted-foreground">Avg Fidelity</div>
                          </div>
                        )}
                        {quantumMetrics.errorRate !== undefined && (
                          <div className="p-4 rounded-lg bg-muted/50 text-center">
                            <div className="text-2xl font-bold text-destructive">{(quantumMetrics.errorRate * 100).toFixed(3)}%</div>
                            <div className="text-sm text-muted-foreground">Error Rate</div>
                          </div>
                        )}
                        {quantumMetrics.purity !== undefined && (
                          <div className="p-4 rounded-lg bg-muted/50 text-center">
                            <div className="text-2xl font-bold text-primary">{quantumMetrics.purity.toFixed(4)}</div>
                            <div className="text-sm text-muted-foreground">Purity</div>
                          </div>
                        )}
                        {quantumMetrics.entropy !== undefined && (
                          <div className="p-4 rounded-lg bg-muted/50 text-center">
                            <div className="text-2xl font-bold text-primary">{quantumMetrics.entropy.toFixed(4)}</div>
                            <div className="text-sm text-muted-foreground">Entropy</div>
                          </div>
                        )}
                        {quantumMetrics.t1 !== undefined && (
                          <div className="p-4 rounded-lg bg-muted/50 text-center">
                            <div className="text-2xl font-bold text-primary">{quantumMetrics.t1.toFixed(2)} μs</div>
                            <div className="text-sm text-muted-foreground">T1 Time</div>
                          </div>
                        )}
                        {quantumMetrics.t2 !== undefined && (
                          <div className="p-4 rounded-lg bg-muted/50 text-center">
                            <div className="text-2xl font-bold text-primary">{quantumMetrics.t2.toFixed(2)} μs</div>
                            <div className="text-sm text-muted-foreground">T2 Time</div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Tabs defaultValue="visualization" className="space-y-6">
                  <TabsList className="glass">
                    <TabsTrigger value="visualization" className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Visualization
                    </TabsTrigger>
                    <TabsTrigger value="statistics" className="flex items-center gap-2">
                      <Calculator className="w-4 h-4" />
                      Statistics
                    </TabsTrigger>
                    <TabsTrigger value="data" className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4" />
                      Data Table
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="visualization">
                    <Card className="glass border-primary/20">
                      <CardHeader>
                        <CardTitle className="text-foreground">Data Visualization</CardTitle>
                        <CardDescription>Configure chart type and axes</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex flex-wrap gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Chart Type</label>
                            <Select value={chartType} onValueChange={(v: typeof chartType) => setChartType(v)}>
                              <SelectTrigger className="w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="line">Line</SelectItem>
                                <SelectItem value="bar">Bar</SelectItem>
                                <SelectItem value="scatter">Scatter</SelectItem>
                                <SelectItem value="area">Area</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">X Axis</label>
                            <Select value={xAxis} onValueChange={setXAxis}>
                              <SelectTrigger className="w-[160px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="index">Index</SelectItem>
                                {numericColumns.map(col => (
                                  <SelectItem key={col} value={col}>{col}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Y Axis</label>
                            <Select value={yAxis} onValueChange={setYAxis}>
                              <SelectTrigger className="w-[160px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {numericColumns.map(col => (
                                  <SelectItem key={col} value={col}>{col}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="h-[400px]">
                          <ResponsiveContainer width="100%" height="100%">
                            {renderChart() || <div className="flex items-center justify-center h-full text-muted-foreground">Select axes to visualize data</div>}
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="statistics">
                    <Card className="glass border-primary/20">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-foreground">
                          <TrendingUp className="w-5 h-5 text-primary" />
                          Statistical Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Column</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Count</TableHead>
                                <TableHead>Unique</TableHead>
                                <TableHead>Min</TableHead>
                                <TableHead>Max</TableHead>
                                <TableHead>Mean</TableHead>
                                <TableHead>Std Dev</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {stats.map(stat => (
                                <TableRow key={stat.name}>
                                  <TableCell className="font-medium">{stat.name}</TableCell>
                                  <TableCell>
                                    <Badge variant={stat.type === 'number' ? 'default' : 'secondary'}>
                                      {stat.type}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{stat.count}</TableCell>
                                  <TableCell>{stat.unique}</TableCell>
                                  <TableCell>{stat.min?.toFixed(4) ?? '-'}</TableCell>
                                  <TableCell>{stat.max?.toFixed(4) ?? '-'}</TableCell>
                                  <TableCell>{stat.mean?.toFixed(4) ?? '-'}</TableCell>
                                  <TableCell>{stat.stdDev?.toFixed(4) ?? '-'}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="data">
                    <Card className="glass border-primary/20">
                      <CardHeader>
                        <CardTitle className="text-foreground">Data Preview</CardTitle>
                        <CardDescription>Showing first 100 rows</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto max-h-[500px]">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-16">#</TableHead>
                                {columns.map(col => (
                                  <TableHead key={col}>{col}</TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {data.slice(0, 100).map((row, i) => (
                                <TableRow key={i}>
                                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                                  {columns.map(col => (
                                    <TableCell key={col}>
                                      {typeof row[col] === 'number' ? (row[col] as number).toFixed(4) : String(row[col])}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default DataAnalysis;
