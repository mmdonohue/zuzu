import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Button, Chip } from '@mui/material';
import { useTonePlayer, useToneOnEvent } from '@/hooks/useTonePlayer';

/**
 * Example Trading Dashboard Component with Audio Feedback
 * 
 * This demonstrates how to integrate the tone player into a trading dashboard.
 * Adapt this pattern for your Mahoraga trading dashboard.
 */

type TradeEvent = {
  type: 'buy' | 'sell';
  symbol: string;
  price: number;
  quantity: number;
  timestamp: Date;
};

type PositionData = {
  symbol: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
};

const TradingDashboardExample: React.FC = () => {
  const { playPreset, playSequence, isReady, initialize } = useTonePlayer();
  
  // Example: Simple hooks for specific events
  const playBuyTone = useToneOnEvent('buy');
  const playSellTone = useToneOnEvent('sell');
  
  const [positions, setPositions] = useState<PositionData[]>([
    {
      symbol: 'AAPL',
      quantity: 10,
      entryPrice: 150.00,
      currentPrice: 152.50,
      pnl: 25.00,
      pnlPercent: 1.67,
    },
  ]);

  const [recentTrade, setRecentTrade] = useState<TradeEvent | null>(null);

  // Play tone when position P&L changes significantly
  useEffect(() => {
    positions.forEach((position) => {
      const prevPnlPercent = position.pnlPercent;
      
      // Check if P&L crossed a threshold (e.g., 2% gain/loss)
      if (prevPnlPercent < 2 && position.pnlPercent >= 2) {
        playPreset('profit');
      } else if (prevPnlPercent > -2 && position.pnlPercent <= -2) {
        playPreset('loss');
      }
    });
  }, [positions, playPreset]);

  // Play tone when a trade is executed
  useEffect(() => {
    if (recentTrade) {
      if (recentTrade.type === 'buy') {
        playBuyTone();
      } else {
        playSellTone();
      }
    }
  }, [recentTrade, playBuyTone, playSellTone]);

  const simulateBuyTrade = () => {
    const trade: TradeEvent = {
      type: 'buy',
      symbol: 'AAPL',
      price: 152.50,
      quantity: 5,
      timestamp: new Date(),
    };
    setRecentTrade(trade);
    
    // Update position
    setPositions((prev) =>
      prev.map((pos) =>
        pos.symbol === trade.symbol
          ? {
              ...pos,
              quantity: pos.quantity + trade.quantity,
              currentPrice: trade.price,
              pnl: (trade.price - pos.entryPrice) * (pos.quantity + trade.quantity),
              pnlPercent: ((trade.price - pos.entryPrice) / pos.entryPrice) * 100,
            }
          : pos
      )
    );
  };

  const simulateSellTrade = () => {
    const trade: TradeEvent = {
      type: 'sell',
      symbol: 'AAPL',
      price: 151.00,
      quantity: 5,
      timestamp: new Date(),
    };
    setRecentTrade(trade);
    
    // Update position
    setPositions((prev) =>
      prev.map((pos) =>
        pos.symbol === trade.symbol
          ? {
              ...pos,
              quantity: pos.quantity - trade.quantity,
              currentPrice: trade.price,
              pnl: (trade.price - pos.entryPrice) * (pos.quantity - trade.quantity),
              pnlPercent: ((trade.price - pos.entryPrice) / pos.entryPrice) * 100,
            }
          : pos
      )
    );
  };

  const simulateProfitChange = () => {
    setPositions((prev) =>
      prev.map((pos) => ({
        ...pos,
        currentPrice: pos.currentPrice + 5,
        pnl: (pos.currentPrice + 5 - pos.entryPrice) * pos.quantity,
        pnlPercent: ((pos.currentPrice + 5 - pos.entryPrice) / pos.entryPrice) * 100,
      }))
    );
    playPreset('profit');
  };

  const simulateLossChange = () => {
    setPositions((prev) =>
      prev.map((pos) => ({
        ...pos,
        currentPrice: pos.currentPrice - 5,
        pnl: (pos.currentPrice - 5 - pos.entryPrice) * pos.quantity,
        pnlPercent: ((pos.currentPrice - 5 - pos.entryPrice) / pos.entryPrice) * 100,
      }))
    );
    playPreset('loss');
  };

  const playCelebrationSequence = () => {
    // Play a sequence of tones for a big win
    playSequence(['profit', 'success', 'profit'], 0.15);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Trading Dashboard Audio Feedback Demo
      </Typography>

      {!isReady && (
        <Card sx={{ mb: 3, bgcolor: '#fff3cd', color: '#856404' }}>
          <CardContent>
            <Typography variant="body2">
              Audio not initialized. Click anywhere or click the button below to enable audio feedback.
            </Typography>
            <Button variant="contained" onClick={initialize} sx={{ mt: 1 }}>
              Enable Audio
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Position Display */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Current Positions
          </Typography>
          {positions.map((position) => (
            <Box key={position.symbol} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="h5">{position.symbol}</Typography>
                <Chip
                  label={`${position.pnlPercent > 0 ? '+' : ''}${position.pnlPercent.toFixed(2)}%`}
                  color={position.pnl >= 0 ? 'success' : 'error'}
                  size="small"
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Quantity: {position.quantity} | Entry: ${position.entryPrice.toFixed(2)} | 
                Current: ${position.currentPrice.toFixed(2)}
              </Typography>
              <Typography variant="body1" color={position.pnl >= 0 ? 'success.main' : 'error.main'}>
                P&L: ${position.pnl.toFixed(2)}
              </Typography>
            </Box>
          ))}
        </CardContent>
      </Card>

      {/* Recent Trade */}
      {recentTrade && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Trade
            </Typography>
            <Typography>
              <Chip
                label={recentTrade.type.toUpperCase()}
                color={recentTrade.type === 'buy' ? 'primary' : 'secondary'}
                size="small"
                sx={{ mr: 1 }}
              />
              {recentTrade.quantity} {recentTrade.symbol} @ ${recentTrade.price.toFixed(2)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {recentTrade.timestamp.toLocaleTimeString()}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Test Controls */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Test Audio Feedback
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Button variant="contained" color="primary" onClick={simulateBuyTrade}>
              Simulate Buy Trade
            </Button>
            <Button variant="contained" color="secondary" onClick={simulateSellTrade}>
              Simulate Sell Trade
            </Button>
            <Button variant="contained" color="success" onClick={simulateProfitChange}>
              Simulate Profit +5%
            </Button>
            <Button variant="contained" color="error" onClick={simulateLossChange}>
              Simulate Loss -5%
            </Button>
            <Button variant="outlined" onClick={playCelebrationSequence}>
              Play Celebration Sequence
            </Button>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Individual Tone Tests
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Button size="small" onClick={() => playPreset('buy')}>Buy</Button>
              <Button size="small" onClick={() => playPreset('sell')}>Sell</Button>
              <Button size="small" onClick={() => playPreset('profit')}>Profit</Button>
              <Button size="small" onClick={() => playPreset('loss')}>Loss</Button>
              <Button size="small" onClick={() => playPreset('warning')}>Warning</Button>
              <Button size="small" onClick={() => playPreset('success')}>Success</Button>
              <Button size="small" onClick={() => playPreset('info')}>Info</Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card sx={{ mt: 3, bgcolor: '#e7f5ff' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Integration Guide
          </Typography>
          <Typography variant="body2" paragraph>
            To use in your Mahoraga dashboard:
          </Typography>
          <Typography variant="body2" component="div">
            <ol style={{ paddingLeft: 20 }}>
              <li>Import the hook: <code>import {`{ useTonePlayer }`} from '@/hooks/useTonePlayer'</code></li>
              <li>Use in your component: <code>const {`{ playPreset }`} = useTonePlayer()</code></li>
              <li>Call on events:
                <ul style={{ paddingLeft: 20, marginTop: 8 }}>
                  <li><code>playPreset('buy')</code> - When buy order executed</li>
                  <li><code>playPreset('sell')</code> - When sell order executed</li>
                  <li><code>playPreset('profit')</code> - When P&L increases significantly</li>
                  <li><code>playPreset('loss')</code> - When P&L decreases significantly</li>
                  <li><code>playPreset('warning')</code> - For risk alerts</li>
                </ul>
              </li>
            </ol>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TradingDashboardExample;
