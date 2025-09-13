import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Clock } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  time: string;
  category: 'market' | 'company' | 'economy' | 'policy';
  impact: 'high' | 'medium' | 'low';
}

const newsData: NewsItem[] = [
  {
    id: '1',
    title: 'RBI Keeps Repo Rate Unchanged at 6.5%',
    summary: 'Central bank maintains accommodative stance while monitoring inflation trends.',
    source: 'Economic Times',
    time: '2 hours ago',
    category: 'policy',
    impact: 'high'
  },
  {
    id: '2',
    title: 'Reliance Industries Q3 Results Beat Estimates',
    summary: 'Company reports 15% YoY growth in net profit driven by strong refining margins.',
    source: 'Business Standard',
    time: '4 hours ago',
    category: 'company',
    impact: 'medium'
  },
  {
    id: '3',
    title: 'IT Sector Outlook Remains Positive',
    summary: 'Analysts upgrade ratings on major IT stocks citing strong deal pipeline.',
    source: 'Mint',
    time: '6 hours ago',
    category: 'market',
    impact: 'medium'
  },
  {
    id: '4',
    title: 'FII Inflows Hit 3-Month High',
    summary: 'Foreign institutional investors pump in ₹8,500 crores in Indian equities.',
    source: 'Moneycontrol',
    time: '8 hours ago',
    category: 'market',
    impact: 'high'
  },
  {
    id: '5',
    title: 'Banking Sector Shows Strong Growth',
    summary: 'Credit growth accelerates to 16% YoY with improving asset quality.',
    source: 'Financial Express',
    time: '10 hours ago',
    category: 'market',
    impact: 'medium'
  }
];

function getCategoryColor(category: string) {
  switch (category) {
    case 'market': return 'bg-trading-primary/10 text-trading-primary';
    case 'company': return 'bg-profit/10 text-profit';
    case 'economy': return 'bg-warning/10 text-warning';
    case 'policy': return 'bg-loss/10 text-loss';
    default: return 'bg-muted text-muted-foreground';
  }
}

function getImpactColor(impact: string) {
  switch (impact) {
    case 'high': return 'bg-loss text-white';
    case 'medium': return 'bg-warning text-white';
    case 'low': return 'bg-muted text-muted-foreground';
    default: return 'bg-muted text-muted-foreground';
  }
}

export function NewsWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Market News</span>
          <ExternalLink className="h-4 w-4 text-muted-foreground" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {newsData.map((news) => (
            <div
              key={news.id}
              className="p-3 rounded-lg border bg-gradient-card hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium text-sm leading-tight line-clamp-2">
                    {news.title}
                  </h4>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getImpactColor(news.impact)}`}
                  >
                    {news.impact.toUpperCase()}
                  </Badge>
                </div>
                
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {news.summary}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getCategoryColor(news.category)}`}
                    >
                      {news.category.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {news.source}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{news.time}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="pt-4 border-t mt-4">
          <button className="w-full text-center text-sm text-trading-primary hover:underline">
            View All Market News
          </button>
        </div>
      </CardContent>
    </Card>
  );
}