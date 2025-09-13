import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MarketIndices } from '@/components/market-data/MarketIndices';
import { Watchlist } from '@/components/market-data/Watchlist';
import { TopMovers } from '@/components/market-data/TopMovers';
import { MarketDepth } from '@/components/market-data/MarketDepth';
import { SectorPerformance } from '@/components/market-data/SectorPerformance';
import { MarketHeatmap } from '@/components/market-data/MarketHeatmap';
import { NewsWidget } from '@/components/market-data/NewsWidget';

export default function MarketData() {
  return (
    <div className="space-y-6">
      {/* Market Overview */}
      <div>
        <h1 className="text-2xl font-semibold mb-4">Market Data</h1>
        <MarketIndices />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
          <TabsTrigger value="sectors">Sectors</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopMovers />
            <MarketDepth />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <MarketHeatmap />
            </div>
            <NewsWidget />
          </div>
        </TabsContent>

        <TabsContent value="watchlist" className="space-y-6">
          <Watchlist />
        </TabsContent>

        <TabsContent value="sectors" className="space-y-6">
          <SectorPerformance />
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Market Sentiment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Bull/Bear Ratio</span>
                    <span className="text-profit font-semibold">65:35</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Fear & Greed Index</span>
                    <span className="text-warning font-semibold">72 (Greed)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Put/Call Ratio</span>
                    <span className="text-neutral font-semibold">0.82</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Market Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Advances</span>
                    <span className="text-profit font-semibold">1,245</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Declines</span>
                    <span className="text-loss font-semibold">892</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Unchanged</span>
                    <span className="text-neutral font-semibold">156</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}