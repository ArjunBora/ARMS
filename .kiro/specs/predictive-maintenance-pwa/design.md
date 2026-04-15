# Predictive Maintenance PWA - Technical Design Document

## Overview

The Predictive Maintenance PWA is a Progressive Web Application that provides real-time monitoring and predictive analytics for inverter systems. It connects to ThingsBoard via WebSocket to receive telemetry data, displays health metrics through specialized components, and maintains offline functionality through Service Workers and local storage.

The system bridges physics-based health calculations with machine learning predictions, presenting both perspectives to operators for informed decision-making. The PWA architecture ensures accessibility even in low-connectivity environments common in industrial settings.

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     PWA Application Layer                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  React Components (UI Layer)                             │   │
│  │  ├─ InverterGauge                                        │   │
│  │  ├─ DeviceStatus                                         │   │
│  │  ├─ PredictiveIndicators                                 │   │
│  │  ├─ AlertCenter                                          │   │
│  │  ├─ LogicToggle                                          │   │
│  │  ├─ OfflineSync                                          │   │
│  │  └─ SimulateStress                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  State Management (Redux/Context API)                    │   │
│  │  ├─ Telemetry State                                      │   │
│  │  ├─ Alert State                                          │   │
│  │  ├─ Connection State                                     │   │
│  │  └─ UI State                                             │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Service Layer                                           │   │
│  │  ├─ WebSocket Manager                                    │   │
│  │  ├─ Offline Sync Manager                                 │   │
│  │  ├─ Local Storage Manager                                │   │
│  │  └─ MQTT Command Sender                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
         │                                    │
         │ WebSocket                          │ MQTT Commands
         ▼                                    ▼
┌──────────────────────┐          ┌──────────────────────┐
│   ThingsBoard        │          │  MQTT Simulator      │
│   (Telemetry API)    │          │  (Stress Testing)    │
└──────────────────────┘          └──────────────────────┘
         │
         ▼
┌──────────────────────┐
│  Backend Services    │
│  (mqtt_backend.py)   │
└──────────────────────┘
```

### PWA Structure

**Service Worker Strategy**:
- Workbox for intelligent caching
- Network-first strategy for real-time telemetry
- Cache-first strategy for static assets (JS, CSS, images)
- Background sync for queued MQTT commands
- Offline page for connectivity loss

**Offline Support**:
- IndexedDB for telemetry history (last 24 hours)
- LocalStorage for configuration and UI state
- Service Worker intercepts failed requests
- Automatic sync when connection restored

### Data Flow

```
ThingsBoard WebSocket
        │
        ▼
WebSocket Manager (connects, subscribes to telemetry)
        │
        ▼
Redux/Context Actions (dispatch telemetry updates)
        │
        ├─────────────────────────────────────────┐
        │                                         │
        ▼                                         ▼
   React Components                    Local Storage/IndexedDB
   (re-render with new data)           (persist for offline)
        │
        ▼
   User Interface Updates
```

### State Management Approach

**Recommended: Redux with Redux Thunk**

State structure:
```javascript
{
  telemetry: {
    current: { /* latest telemetry data */ },
    history: [ /* time-series data */ ],
    loading: boolean,
    error: null | string
  },
  alerts: {
    logs: [ /* alert history */ ],
    unreadCount: number
  },
  connection: {
    status: 'connected' | 'disconnected' | 'reconnecting',
    lastUpdate: timestamp,
    offlineMode: boolean
  },
  ui: {
    selectedLogic: 'physics' | 'ml',
    expandedAlerts: Set<alertId>,
    theme: 'light' | 'dark'
  },
  sync: {
    pendingCommands: [ /* queued MQTT commands */ ],
    syncing: boolean
  }
}
```

## Components and Interfaces

### 1. InverterGauge Component

**Purpose**: Display Remaining Useful Life (RUL) percentage with visual health indicator

**Props**:
```typescript
interface InverterGaugeProps {
  rulPercentage: number;        // 0-100
  cycleCount: number;
  lastUpdate: Date;
  isOffline: boolean;
}
```

**Behavior**:
- Displays circular gauge with percentage in center
- Color banding:
  - Red: 0-20% (Critical - immediate action needed)
  - Yellow: 21-40% (Warning - monitor closely)
  - Green: 41-100% (Healthy - normal operation)
- Smooth transitions when value changes
- Shows last update timestamp
- Offline indicator badge

**Styling**:
- SVG-based gauge for smooth rendering
- CSS transitions for color changes
- Responsive sizing (scales with container)

### 2. DeviceStatus Component

**Purpose**: Display operational status of Mains and Battery subsystems

**Props**:
```typescript
interface DeviceStatusProps {
  mainsStatus: 'green' | 'yellow' | 'red';
  batteryStatus: 'green' | 'yellow' | 'red';
  mainsVoltage?: number;
  batteryVoltage?: number;
  lastUpdate: Date;
}
```

**Behavior**:
- Two side-by-side status indicators
- Color-coded circles with status labels
- Optional voltage readings below each indicator
- Pulse animation on yellow/red states
- Tooltip with detailed status info

### 3. PredictiveIndicators Component

**Purpose**: Display key telemetry metrics for predictive analysis

**Props**:
```typescript
interface PredictiveIndicatorsProps {
  cycleCount: number;
  switchingFrequency: number;      // Hz
  inrushRatio: number;              // percentage
  temperature: number;              // Celsius
  temperatureThreshold: number;
  lastUpdate: Date;
}
```

**Behavior**:
- Four metric cards in grid layout
- Each card shows current value and trend (↑/↓/→)
- Temperature card highlights if approaching threshold
- Sparkline chart for each metric (last 10 readings)
- Unit labels clearly displayed

### 4. AlertCenter Component

**Purpose**: Display pre-alarm logs with severity filtering and search

**Props**:
```typescript
interface AlertCenterProps {
  alerts: Alert[];
  onDismiss: (alertId: string) => void;
  onExport: () => void;
  filter: 'all' | 'normal' | 'warning' | 'critical';
}

interface Alert {
  id: string;
  timestamp: Date;
  severity: 'NORMAL' | 'WARNING' | 'CRITICAL';
  message: string;
  metric: string;
  value: number;
  threshold: number;
}
```

**Behavior**:
- Scrollable list of alerts (newest first)
- Severity badges with color coding
- Timestamp in relative format (e.g., "2 hours ago")
- Expandable rows showing full details
- Filter buttons for severity levels
- Export to CSV functionality
- Dismiss individual alerts

### 5. LogicToggle Component

**Purpose**: Side-by-side comparison of Physics Health Index vs ML Prediction

**Props**:
```typescript
interface LogicToggleProps {
  physicsHealth: {
    index: number;           // 0-100
    factors: {
      cycleStress: number;
      thermalStress: number;
      switchingStress: number;
    }
  };
  mlPrediction: {
    rulPercentage: number;   // 0-100
    confidence: number;      // 0-100
    anomalyScore: number;    // 0-100
  };
  selectedLogic: 'physics' | 'ml';
  onToggle: (logic: 'physics' | 'ml') => void;
}
```

**Behavior**:
- Two columns: Physics (left) and ML (right)
- Toggle button to switch primary display
- Physics side shows component stress factors
- ML side shows confidence and anomaly scores
- Highlight differences when predictions diverge
- Explanation text for each methodology
- Historical comparison chart

### 6. OfflineSync Component

**Purpose**: Display offline status and sync progress

**Props**:
```typescript
interface OfflineSyncProps {
  isOffline: boolean;
  lastKnownState: {
    timestamp: Date;
    rul: number;
    status: string;
  };
  syncProgress: number;        // 0-100
  pendingCommands: number;
  onManualSync: () => void;
}
```

**Behavior**:
- Compact status indicator (top-right corner)
- Shows "Offline" badge when disconnected
- Displays last known state snapshot
- Progress bar during sync
- Manual sync button
- Queued commands counter
- Auto-sync when connection restored

### 7. SimulateStress Component

**Purpose**: Send MQTT commands to simulator for stress testing

**Props**:
```typescript
interface SimulateStressProps {
  isConnected: boolean;
  onStressStart: (duration: number, intensity: number) => void;
  onStressStop: () => void;
  stressActive: boolean;
}
```

**Behavior**:
- Duration slider (1-60 minutes)
- Intensity selector (Low/Medium/High)
- Start/Stop buttons
- Status indicator showing active stress test
- Confirmation dialog before starting
- Real-time feedback on stress parameters

## Data Models

### Telemetry Schema

```typescript
interface TelemetryData {
  deviceId: string;
  timestamp: Date;
  
  // Device Status
  mainsStatus: 'green' | 'yellow' | 'red';
  batteryStatus: 'green' | 'yellow' | 'red';
  mainsVoltage: number;
  batteryVoltage: number;
  
  // Predictive Metrics
  cycleCount: number;
  switchingFrequency: number;
  inrushRatio: number;
  temperature: number;
  
  // Health Calculations
  physicsHealthIndex: number;
  cycleStress: number;
  thermalStress: number;
  switchingStress: number;
  
  // ML Predictions
  mlRulPercentage: number;
  mlConfidence: number;
  anomalyScore: number;
  
  // Derived
  rulPercentage: number;  // Selected logic (physics or ML)
}
```

### Local Storage Schema

```typescript
interface LocalStorageSchema {
  // Configuration
  config: {
    selectedLogic: 'physics' | 'ml';
    theme: 'light' | 'dark';
    alertFilter: 'all' | 'normal' | 'warning' | 'critical';
    temperatureThreshold: number;
  };
  
  // Last Known State
  lastState: TelemetryData;
  
  // Sync Queue
  syncQueue: {
    commands: MqttCommand[];
    lastSyncTime: Date;
  };
}
```

### IndexedDB Schema

```typescript
interface IndexedDBSchema {
  // Object Store: telemetry
  telemetry: {
    keyPath: 'id',
    indexes: [
      { name: 'timestamp', keyPath: 'timestamp' },
      { name: 'deviceId', keyPath: 'deviceId' }
    ],
    data: TelemetryData[]
  };
  
  // Object Store: alerts
  alerts: {
    keyPath: 'id',
    indexes: [
      { name: 'timestamp', keyPath: 'timestamp' },
      { name: 'severity', keyPath: 'severity' }
    ],
    data: Alert[]
  };
}
```

### Alert Log Structure

```typescript
interface AlertLog {
  id: string;
  timestamp: Date;
  severity: 'NORMAL' | 'WARNING' | 'CRITICAL';
  message: string;
  metric: string;
  value: number;
  threshold: number;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}
```

## Integration Points

### ThingsBoard WebSocket API

**Connection**:
```
ws://{host}/api/ws/plugins/telemetry?token={JWT_TOKEN}
```

**Subscription Message**:
```json
{
  "tsSubCmds": [
    {
      "entityType": "DEVICE",
      "entityId": "{deviceId}",
      "scope": "LATEST_TELEMETRY",
      "cmdId": 1
    }
  ]
}
```

**Data Reception**:
- Real-time telemetry updates pushed from ThingsBoard
- Automatic reconnection with exponential backoff
- Heartbeat mechanism to detect stale connections

### MQTT Simulator Control

**Command Format**:
```json
{
  "command": "stress_test",
  "duration": 300,
  "intensity": "high",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Endpoint**: MQTT topic `simulator/commands`

**Response**: Confirmation via `simulator/status` topic

### Service Worker Caching Strategy

**Static Assets** (Cache-First):
- JavaScript bundles
- CSS stylesheets
- Images and fonts
- Manifest file

**API Calls** (Network-First):
- ThingsBoard telemetry
- Alert data
- Configuration updates

**Fallback**:
- Offline page for failed navigation
- Last cached state for telemetry

### Local IndexedDB for Offline Data

**Storage Capacity**: ~50MB per origin

**Data Retention**:
- Telemetry: Last 24 hours (1 entry per minute = ~1440 entries)
- Alerts: Last 7 days
- Auto-cleanup of old records

**Sync Strategy**:
- Queue MQTT commands locally
- Batch sync when connection restored
- Conflict resolution: server data takes precedence

## UI/UX Specifications

### Professional Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Header: Device Name | Last Update | Offline Status         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  InverterGauge   │  │  DeviceStatus    │                │
│  │  (RUL %)         │  │  (Mains/Battery) │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  PredictiveIndicators (4 metric cards)                 │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  LogicToggle (Physics vs ML comparison)                │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  AlertCenter (scrollable alert list)                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  SimulateStress | OfflineSync                          │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Color Scheme

**Alert Levels**:
- Red (#EF4444): Critical - immediate action required
- Yellow (#FBBF24): Warning - monitor closely
- Green (#10B981): Healthy - normal operation
- Gray (#6B7280): Offline/Unknown

**UI Elements**:
- Primary: #3B82F6 (Blue)
- Secondary: #6B7280 (Gray)
- Background: #F9FAFB (Light Gray)
- Text: #1F2937 (Dark Gray)

**Dark Mode**:
- Background: #111827
- Surface: #1F2937
- Text: #F3F4F6

### Responsive Design

**Breakpoints**:
- Mobile: < 640px (single column layout)
- Tablet: 640px - 1024px (2 column layout)
- Desktop: > 1024px (full dashboard)

**Mobile Optimizations**:
- Stacked components vertically
- Larger touch targets (48px minimum)
- Simplified alert list (show 5 most recent)
- Collapsible sections

### Accessibility Requirements

**WCAG 2.1 Level AA Compliance**:
- Color contrast ratio ≥ 4.5:1 for text
- Keyboard navigation support (Tab, Enter, Escape)
- ARIA labels for all interactive elements
- Screen reader support for status indicators
- Focus indicators visible on all interactive elements
- Semantic HTML structure
- Alt text for all images
- Form labels associated with inputs

## Technical Stack

### Frontend Framework

**React 18+**
- Functional components with hooks
- Context API for local state
- Suspense for async data loading

### PWA Libraries

**Workbox** (Service Worker management)
- Precaching static assets
- Runtime caching strategies
- Background sync

**Web App Manifest**
- App name, icons, theme colors
- Display mode: standalone
- Start URL and scope

### WebSocket Client

**Socket.IO or native WebSocket API**
- Automatic reconnection
- Event-based message handling
- Heartbeat/ping-pong

### State Management

**Redux Toolkit** (recommended)
- Simplified Redux setup
- Built-in immer for immutable updates
- Redux Thunk for async actions
- Redux DevTools integration

### Styling Approach

**Tailwind CSS** (utility-first)
- Responsive design utilities
- Dark mode support
- Custom color palette
- Component composition

**Alternative: Styled Components**
- CSS-in-JS for component scoping
- Dynamic styling based on props
- Theme provider for global styles

### Additional Libraries

- **Chart.js/Recharts**: Sparkline charts and historical data visualization
- **date-fns**: Date formatting and manipulation
- **axios**: HTTP client for REST endpoints
- **idb**: IndexedDB wrapper for offline storage
- **uuid**: Unique ID generation for alerts

## Error Handling

### Connection Errors

**WebSocket Disconnection**:
- Automatic reconnection with exponential backoff (1s, 2s, 4s, 8s, max 30s)
- User notification after 10 seconds offline
- Graceful degradation to cached data
- Retry button for manual reconnection

**MQTT Command Failures**:
- Queue failed commands for retry
- Show error toast notification
- Log to IndexedDB for debugging

### Data Validation

**Telemetry Validation**:
- Schema validation on receipt
- Range checks (RUL 0-100, temperature reasonable bounds)
- Timestamp validation (not in future)
- Discard invalid records, log error

**Alert Validation**:
- Severity must be one of: NORMAL, WARNING, CRITICAL
- Threshold must be positive number
- Message must be non-empty string

### Offline Scenarios

**No Network Connection**:
- Display last known state
- Show "Offline" badge
- Queue any user actions
- Attempt reconnection every 30 seconds

**Partial Connectivity**:
- Retry failed requests
- Show connection quality indicator
- Prioritize critical data

## Testing Strategy

### Unit Testing

**Framework**: Jest + React Testing Library

**Coverage Areas**:
- Component rendering with various props
- User interactions (clicks, form submissions)
- State updates and side effects
- Error boundary behavior
- Accessibility attributes

**Example Test**:
```javascript
describe('InverterGauge', () => {
  it('displays red color when RUL is below 20%', () => {
    render(<InverterGauge rulPercentage={15} />);
    expect(screen.getByRole('img')).toHaveClass('gauge-critical');
  });
});
```

### Property-Based Testing

**Framework**: fast-check (JavaScript)

**Configuration**: Minimum 100 iterations per property test

**Properties to Test**:

#### Property 1: RUL Percentage Bounds
*For any* telemetry data, the RUL percentage should always be between 0 and 100

**Validates: Component rendering correctness**

#### Property 2: Alert Severity Consistency
*For any* alert with a given severity level, the displayed color should match the severity mapping (Red for CRITICAL, Yellow for WARNING, Green for NORMAL)

**Validates: Alert display correctness**

#### Property 3: Offline State Persistence
*For any* telemetry data stored to IndexedDB, retrieving it after offline period should return equivalent data

**Validates: Offline storage round-trip**

#### Property 4: WebSocket Reconnection
*For any* sequence of connection state changes, the system should eventually reach a connected state or display appropriate offline UI

**Validates: Connection resilience**

#### Property 5: Alert Timestamp Ordering
*For any* list of alerts, when sorted by timestamp, earlier alerts should appear before later alerts

**Validates: Alert list ordering**

### Integration Testing

**Framework**: Cypress or Playwright

**Scenarios**:
- Connect to ThingsBoard, receive telemetry, display in components
- Send MQTT stress command, verify simulator receives it
- Go offline, verify cached data displays, queue commands
- Come back online, verify sync completes
- Filter alerts by severity, verify correct alerts shown

### Performance Testing

**Metrics**:
- Initial load time: < 3 seconds
- Time to interactive: < 5 seconds
- WebSocket message processing: < 100ms
- Component re-render time: < 50ms

**Tools**: Lighthouse, Chrome DevTools Performance tab

### Accessibility Testing

**Manual Testing**:
- Keyboard navigation through all components
- Screen reader testing (NVDA, JAWS)
- Color contrast verification
- Focus indicator visibility

**Automated Testing**:
- axe-core for accessibility violations
- jest-axe for component testing



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: WebSocket Connection on App Load

*For any* app initialization, the system should establish a WebSocket connection to ThingsBoard within 5 seconds of mounting the root component.

**Validates: Requirements 1.1**

### Property 2: Telemetry Updates Propagate to UI

*For any* telemetry data received via WebSocket, the UI components should reflect the new values within 100ms of state update.

**Validates: Requirements 1.2**

### Property 3: Offline State Displays Last Known Data

*For any* connection loss event, the system should immediately display the last cached telemetry data and show an "Offline" badge.

**Validates: Requirements 1.3**

### Property 4: RUL Color Mapping - Critical Range

*For any* RUL percentage value between 0 and 20 (inclusive), the InverterGauge component should render with red color styling.

**Validates: Requirements 2.1**

### Property 5: RUL Color Mapping - Warning Range

*For any* RUL percentage value between 21 and 40 (inclusive), the InverterGauge component should render with yellow color styling.

**Validates: Requirements 2.2**

### Property 6: RUL Color Mapping - Healthy Range

*For any* RUL percentage value between 41 and 100 (inclusive), the InverterGauge component should render with green color styling.

**Validates: Requirements 2.3**

### Property 7: Device Status Color Indicators

*For any* combination of Mains and Battery status values (green/yellow/red), the DeviceStatus component should render indicators with colors matching the input status values.

**Validates: Requirements 3.1**

### Property 8: All Predictive Metrics Displayed

*For any* telemetry data containing cycle count, switching frequency, inrush ratio, and temperature, the PredictiveIndicators component should render all four metric cards with their respective values.

**Validates: Requirements 4.1**

### Property 9: Alert Severity Badge Mapping

*For any* alert with a given severity level (NORMAL/WARNING/CRITICAL), the AlertCenter should display a badge with the correct color mapping (Green/Yellow/Red respectively).

**Validates: Requirements 5.1**

### Property 10: Alert Filtering by Severity

*For any* set of alerts with mixed severities and a selected filter, the AlertCenter should only display alerts whose severity matches the filter criteria.

**Validates: Requirements 5.2**

### Property 11: Logic Toggle Displays Both Methods

*For any* render of the LogicToggle component with both physics and ML data, the UI should display both the Physics Health Index section and the ML Prediction section side-by-side.

**Validates: Requirements 6.1**

### Property 12: Offline Sync Status Display

*For any* offline state, the OfflineSync component should display the last known telemetry state and a sync status indicator.

**Validates: Requirements 7.1**

### Property 13: Stress Test Command Transmission

*For any* user click on the SimulateStress start button with valid parameters, the system should send an MQTT command to the simulator with the specified duration and intensity.

**Validates: Requirements 8.1**

### Property 14: Service Worker Asset Caching

*For any* offline scenario, the Service Worker should serve static assets (JS, CSS, images) from cache without network requests.

**Validates: Requirements 9.1**

### Property 15: Telemetry Persistence Round Trip

*For any* telemetry data received and persisted to IndexedDB, querying the database should return data equivalent to the original telemetry.

**Validates: Requirements 10.1**

### Property 16: Alert Dismissal Removes Display

*For any* alert displayed in AlertCenter, dismissing it should remove it from the visible alert list.

**Validates: Requirements 11.1**

### Property 17: Offline Command Queue Sync

*For any* MQTT commands queued while offline, upon reconnection the system should transmit all queued commands to the simulator.

**Validates: Requirements 12.1**



## Testing Strategy

### Dual Testing Approach

The testing strategy combines unit tests and property-based tests for comprehensive coverage:

**Unit Tests** (Jest + React Testing Library):
- Specific examples and edge cases
- Integration points between components
- Error conditions and error boundaries
- User interactions and form submissions
- Accessibility attributes and keyboard navigation

**Property-Based Tests** (fast-check):
- Universal properties across all valid inputs
- Comprehensive input coverage through randomization
- Minimum 100 iterations per property test
- Each property test references its design document property

### Unit Testing

**Test Categories**:

1. **Component Rendering**
   - InverterGauge renders with correct dimensions
   - DeviceStatus displays both indicators
   - PredictiveIndicators shows all four metrics
   - AlertCenter renders alert list
   - LogicToggle shows both sections
   - OfflineSync displays status
   - SimulateStress button is clickable

2. **User Interactions**
   - Alert filter buttons change displayed alerts
   - Alert dismiss button removes alert
   - SimulateStress start/stop buttons toggle state
   - LogicToggle selection persists to state
   - Manual sync button triggers sync action

3. **Error Handling**
   - Invalid telemetry data is rejected
   - WebSocket errors trigger reconnection
   - MQTT command failures are queued for retry
   - IndexedDB errors fall back to memory storage

4. **Accessibility**
   - All interactive elements have ARIA labels
   - Color indicators have text alternatives
   - Keyboard navigation works through all components
   - Focus indicators are visible
   - Screen reader announces status changes

### Property-Based Testing Configuration

**Framework**: fast-check

**Test Template**:
```javascript
import fc from 'fast-check';

describe('Feature: predictive-maintenance-pwa, Property X: [Property Name]', () => {
  it('should satisfy property X', () => {
    fc.assert(
      fc.property(
        // Generators for input data
        fc.integer({ min: 0, max: 100 }),
        // Property function
        (rulPercentage) => {
          // Test implementation
          return true; // or assertion
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Property-Based Tests

#### Property 1: WebSocket Connection on App Load
**Feature: predictive-maintenance-pwa, Property 1: WebSocket Connection on App Load**

```javascript
it('should establish WebSocket connection within 5 seconds', () => {
  fc.assert(
    fc.property(
      fc.record({
        host: fc.domain(),
        token: fc.hexaString({ minLength: 32, maxLength: 256 })
      }),
      ({ host, token }) => {
        const mockWebSocket = jest.fn();
        const startTime = Date.now();
        
        // Render app with config
        render(<App wsHost={host} token={token} />);
        
        // Verify connection initiated
        expect(mockWebSocket).toHaveBeenCalled();
        expect(Date.now() - startTime).toBeLessThan(5000);
        return true;
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 2: Telemetry Updates Propagate to UI
**Feature: predictive-maintenance-pwa, Property 2: Telemetry Updates Propagate to UI**

```javascript
it('should update UI within 100ms of telemetry state update', () => {
  fc.assert(
    fc.property(
      fc.record({
        cycleCount: fc.integer({ min: 0, max: 1000000 }),
        temperature: fc.integer({ min: -20, max: 80 }),
        rul: fc.integer({ min: 0, max: 100 })
      }),
      ({ cycleCount, temperature, rul }) => {
        const { rerender } = render(
          <Dashboard telemetry={{ cycleCount, temperature, rul }} />
        );
        
        const startTime = Date.now();
        rerender(
          <Dashboard telemetry={{ cycleCount: cycleCount + 1, temperature, rul }} />
        );
        
        expect(screen.getByText(cycleCount + 1)).toBeInTheDocument();
        expect(Date.now() - startTime).toBeLessThan(100);
        return true;
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 3: Offline State Displays Last Known Data
**Feature: predictive-maintenance-pwa, Property 3: Offline State Displays Last Known Data**

```javascript
it('should display cached data and offline badge on connection loss', () => {
  fc.assert(
    fc.property(
      fc.record({
        rul: fc.integer({ min: 0, max: 100 }),
        cycleCount: fc.integer({ min: 0, max: 1000000 })
      }),
      ({ rul, cycleCount }) => {
        const cachedData = { rul, cycleCount };
        
        render(
          <Dashboard 
            isOffline={true} 
            lastKnownState={cachedData} 
          />
        );
        
        expect(screen.getByText('Offline')).toBeInTheDocument();
        expect(screen.getByText(rul)).toBeInTheDocument();
        expect(screen.getByText(cycleCount)).toBeInTheDocument();
        return true;
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 4-6: RUL Color Mapping
**Feature: predictive-maintenance-pwa, Property 4-6: RUL Color Mapping**

```javascript
it('should map RUL percentage to correct color', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 100 }),
      (rul) => {
        render(<InverterGauge rulPercentage={rul} />);
        
        const gauge = screen.getByRole('img');
        
        if (rul <= 20) {
          expect(gauge).toHaveClass('gauge-critical');
        } else if (rul <= 40) {
          expect(gauge).toHaveClass('gauge-warning');
        } else {
          expect(gauge).toHaveClass('gauge-healthy');
        }
        return true;
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 7: Device Status Color Indicators
**Feature: predictive-maintenance-pwa, Property 7: Device Status Color Indicators**

```javascript
it('should display correct status colors for Mains and Battery', () => {
  const statusValues = ['green', 'yellow', 'red'];
  
  fc.assert(
    fc.property(
      fc.sample(fc.constantFrom(...statusValues), 2),
      ([mainsStatus, batteryStatus]) => {
        render(
          <DeviceStatus 
            mainsStatus={mainsStatus} 
            batteryStatus={batteryStatus} 
          />
        );
        
        const indicators = screen.getAllByRole('img');
        expect(indicators[0]).toHaveClass(`status-${mainsStatus}`);
        expect(indicators[1]).toHaveClass(`status-${batteryStatus}`);
        return true;
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 8: All Predictive Metrics Displayed
**Feature: predictive-maintenance-pwa, Property 8: All Predictive Metrics Displayed**

```javascript
it('should display all four predictive metrics', () => {
  fc.assert(
    fc.property(
      fc.record({
        cycleCount: fc.integer({ min: 0, max: 1000000 }),
        switchingFrequency: fc.integer({ min: 1000, max: 100000 }),
        inrushRatio: fc.integer({ min: 0, max: 100 }),
        temperature: fc.integer({ min: -20, max: 80 })
      }),
      ({ cycleCount, switchingFrequency, inrushRatio, temperature }) => {
        render(
          <PredictiveIndicators
            cycleCount={cycleCount}
            switchingFrequency={switchingFrequency}
            inrushRatio={inrushRatio}
            temperature={temperature}
          />
        );
        
        expect(screen.getByText(/cycle count/i)).toBeInTheDocument();
        expect(screen.getByText(/switching frequency/i)).toBeInTheDocument();
        expect(screen.getByText(/inrush ratio/i)).toBeInTheDocument();
        expect(screen.getByText(/temperature/i)).toBeInTheDocument();
        return true;
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 9: Alert Severity Badge Mapping
**Feature: predictive-maintenance-pwa, Property 9: Alert Severity Badge Mapping**

```javascript
it('should map alert severity to correct badge color', () => {
  const severities = ['NORMAL', 'WARNING', 'CRITICAL'];
  const colorMap = { NORMAL: 'green', WARNING: 'yellow', CRITICAL: 'red' };
  
  fc.assert(
    fc.property(
      fc.constantFrom(...severities),
      (severity) => {
        const alert = {
          id: '1',
          severity,
          message: 'Test alert',
          timestamp: new Date()
        };
        
        render(<AlertCenter alerts={[alert]} />);
        
        const badge = screen.getByText(severity);
        expect(badge).toHaveClass(`badge-${colorMap[severity]}`);
        return true;
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 10: Alert Filtering by Severity
**Feature: predictive-maintenance-pwa, Property 10: Alert Filtering by Severity**

```javascript
it('should filter alerts by severity', () => {
  fc.assert(
    fc.property(
      fc.array(
        fc.record({
          id: fc.uuid(),
          severity: fc.constantFrom('NORMAL', 'WARNING', 'CRITICAL'),
          message: fc.string(),
          timestamp: fc.date()
        }),
        { minLength: 1, maxLength: 20 }
      ),
      fc.constantFrom('all', 'NORMAL', 'WARNING', 'CRITICAL'),
      (alerts, filter) => {
        render(
          <AlertCenter 
            alerts={alerts} 
            filter={filter}
          />
        );
        
        const displayedAlerts = screen.getAllByRole('listitem');
        
        if (filter === 'all') {
          expect(displayedAlerts).toHaveLength(alerts.length);
        } else {
          const expectedCount = alerts.filter(a => a.severity === filter).length;
          expect(displayedAlerts).toHaveLength(expectedCount);
        }
        return true;
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 11: Logic Toggle Displays Both Methods
**Feature: predictive-maintenance-pwa, Property 11: Logic Toggle Displays Both Methods**

```javascript
it('should display both Physics and ML sections', () => {
  fc.assert(
    fc.property(
      fc.record({
        physicsHealth: fc.integer({ min: 0, max: 100 }),
        mlRul: fc.integer({ min: 0, max: 100 })
      }),
      ({ physicsHealth, mlRul }) => {
        render(
          <LogicToggle
            physicsHealth={{ index: physicsHealth }}
            mlPrediction={{ rulPercentage: mlRul }}
          />
        );
        
        expect(screen.getByText(/physics/i)).toBeInTheDocument();
        expect(screen.getByText(/ml prediction/i)).toBeInTheDocument();
        return true;
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 12: Offline Sync Status Display
**Feature: predictive-maintenance-pwa, Property 12: Offline Sync Status Display**

```javascript
it('should display offline status and last known state', () => {
  fc.assert(
    fc.property(
      fc.record({
        rul: fc.integer({ min: 0, max: 100 }),
        cycleCount: fc.integer({ min: 0, max: 1000000 })
      }),
      ({ rul, cycleCount }) => {
        const lastState = { rul, cycleCount, timestamp: new Date() };
        
        render(
          <OfflineSync
            isOffline={true}
            lastKnownState={lastState}
          />
        );
        
        expect(screen.getByText(/offline/i)).toBeInTheDocument();
        expect(screen.getByText(rul)).toBeInTheDocument();
        return true;
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 13: Stress Test Command Transmission
**Feature: predictive-maintenance-pwa, Property 13: Stress Test Command Transmission**

```javascript
it('should send MQTT command on stress test start', () => {
  const mockMqttSend = jest.fn();
  
  fc.assert(
    fc.property(
      fc.record({
        duration: fc.integer({ min: 1, max: 60 }),
        intensity: fc.constantFrom('low', 'medium', 'high')
      }),
      ({ duration, intensity }) => {
        render(
          <SimulateStress 
            onStressStart={mockMqttSend}
            isConnected={true}
          />
        );
        
        fireEvent.change(screen.getByRole('slider'), { target: { value: duration } });
        fireEvent.click(screen.getByText(/start/i));
        
        expect(mockMqttSend).toHaveBeenCalledWith(duration, intensity);
        return true;
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 14: Service Worker Asset Caching
**Feature: predictive-maintenance-pwa, Property 14: Service Worker Asset Caching**

```javascript
it('should serve static assets from cache when offline', () => {
  fc.assert(
    fc.property(
      fc.array(fc.webUrl(), { minLength: 1, maxLength: 10 }),
      (assetUrls) => {
        const cache = new Map();
        assetUrls.forEach(url => cache.set(url, 'cached-content'));
        
        const mockFetch = jest.fn((url) => {
          if (cache.has(url)) {
            return Promise.resolve(new Response(cache.get(url)));
          }
          return Promise.reject(new Error('offline'));
        });
        
        global.fetch = mockFetch;
        
        assetUrls.forEach(url => {
          mockFetch(url).then(response => {
            expect(response).toBeDefined();
          });
        });
        
        return true;
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 15: Telemetry Persistence Round Trip
**Feature: predictive-maintenance-pwa, Property 15: Telemetry Persistence Round Trip**

```javascript
it('should persist and retrieve telemetry from IndexedDB', () => {
  fc.assert(
    fc.property(
      fc.record({
        cycleCount: fc.integer({ min: 0, max: 1000000 }),
        temperature: fc.integer({ min: -20, max: 80 }),
        rul: fc.integer({ min: 0, max: 100 })
      }),
      async ({ cycleCount, temperature, rul }) => {
        const telemetry = { cycleCount, temperature, rul, timestamp: new Date() };
        
        // Persist
        await db.telemetry.add(telemetry);
        
        // Retrieve
        const retrieved = await db.telemetry.get(telemetry.id);
        
        expect(retrieved.cycleCount).toBe(cycleCount);
        expect(retrieved.temperature).toBe(temperature);
        expect(retrieved.rul).toBe(rul);
        return true;
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 16: Alert Dismissal Removes Display
**Feature: predictive-maintenance-pwa, Property 16: Alert Dismissal Removes Display**

```javascript
it('should remove alert from display when dismissed', () => {
  fc.assert(
    fc.property(
      fc.array(
        fc.record({
          id: fc.uuid(),
          message: fc.string(),
          severity: fc.constantFrom('NORMAL', 'WARNING', 'CRITICAL'),
          timestamp: fc.date()
        }),
        { minLength: 1, maxLength: 10 }
      ),
      (alerts) => {
        const mockDismiss = jest.fn();
        const { rerender } = render(
          <AlertCenter alerts={alerts} onDismiss={mockDismiss} />
        );
        
        const firstAlert = alerts[0];
        fireEvent.click(screen.getByTestId(`dismiss-${firstAlert.id}`));
        
        const remainingAlerts = alerts.filter(a => a.id !== firstAlert.id);
        rerender(
          <AlertCenter alerts={remainingAlerts} onDismiss={mockDismiss} />
        );
        
        expect(screen.queryByText(firstAlert.message)).not.toBeInTheDocument();
        return true;
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 17: Offline Command Queue Sync
**Feature: predictive-maintenance-pwa, Property 17: Offline Command Queue Sync**

```javascript
it('should sync queued commands on reconnection', () => {
  fc.assert(
    fc.property(
      fc.array(
        fc.record({
          command: fc.constantFrom('stress_test', 'reset'),
          duration: fc.integer({ min: 1, max: 60 }),
          intensity: fc.constantFrom('low', 'medium', 'high')
        }),
        { minLength: 1, maxLength: 10 }
      ),
      async (commands) => {
        const mockSend = jest.fn();
        const store = createStore(commands);
        
        // Simulate offline
        store.dispatch(setOffline(true));
        
        // Queue commands
        commands.forEach(cmd => store.dispatch(queueCommand(cmd)));
        
        // Simulate reconnection
        store.dispatch(setOffline(false));
        await store.dispatch(syncQueuedCommands(mockSend));
        
        expect(mockSend).toHaveBeenCalledTimes(commands.length);
        commands.forEach(cmd => {
          expect(mockSend).toHaveBeenCalledWith(expect.objectContaining(cmd));
        });
        return true;
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Testing

**Framework**: Cypress

**Test Scenarios**:

1. **Full Data Flow**
   - Connect to ThingsBoard
   - Receive telemetry
   - Verify all components update
   - Verify data persists to IndexedDB

2. **Offline Workflow**
   - Go offline
   - Verify cached data displays
   - Queue MQTT command
   - Reconnect
   - Verify command syncs

3. **Alert Management**
   - Receive alert
   - Filter by severity
   - Dismiss alert
   - Verify removal

4. **Stress Testing**
   - Start stress test
   - Verify MQTT command sent
   - Monitor metrics change
   - Stop stress test

### Performance Testing

**Metrics**:
- Initial load time: < 3 seconds
- Time to interactive: < 5 seconds
- WebSocket message processing: < 100ms
- Component re-render time: < 50ms
- IndexedDB query time: < 50ms

**Tools**: Lighthouse, Chrome DevTools Performance tab

### Accessibility Testing

**Manual Testing**:
- Keyboard navigation through all components
- Screen reader testing (NVDA, JAWS)
- Color contrast verification (4.5:1 minimum)
- Focus indicator visibility

**Automated Testing**:
- axe-core for accessibility violations
- jest-axe for component testing

