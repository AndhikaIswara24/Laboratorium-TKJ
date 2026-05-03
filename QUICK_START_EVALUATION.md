# 🚀 Quick Start Guide - Naive Bayes Evaluation

## Access the Evaluation Page

1. **Login as Admin**
   - Navigate to your lab management system
   - Login with admin credentials

2. **Open Evaluation Page**
   - Go to Admin Dashboard `/admin`
   - Click "🤖 Evaluasi Barang" button or navigate to `/admin/evaluasi`

## Test the Feature

### Test Case 1: Brand New Item (Excellent Condition)
1. Select any item from dropdown
2. Set features:
   - Frekuensi Penggunaan: **20** per bulan
   - Skor Kondisi: Click **5** (Sempurna/Perfect)
3. Click "🔍 Jalankan Evaluasi Naive Bayes"
4. **Expected Result**: ✅ **USABLE** (High Confidence 95%+)

### Test Case 2: Old Item (Poor Condition)
1. Select an item
2. Set features:
   - Frekuensi Penggunaan: **2** per bulan
   - Skor Kondisi: Click **1** (Buruk/Poor)
3. Click evaluate
4. **Expected Result**: ❌ **NOT_USABLE** (95%+)

### Test Case 3: Item Needs Repair
1. Select an item
2. Set features:
   - Frekuensi Penggunaan: **10** per bulan
   - Skor Kondisi: Click **2-3** (Sedang/Medium)
3. Click evaluate
4. **Expected Result**: ⚠️ **NEEDS_REPAIR** (85%+)

## Understanding Results

### Classification Badges
- ✅ **USABLE** (Green): Item is in good condition and ready to use
- ⚠️ **NEEDS_REPAIR** (Yellow): Item can still be used but needs maintenance
- ❌ **NOT_USABLE** (Red): Item is not suitable for use

### Probability Score
- Shows the confidence level (0-100%) for the primary classification
- Higher = more certain the algorithm is about the classification

### Confidence Level
- Measures how clear the decision is
- Based on difference between top 2 probabilities
- High confidence = algorithm is very sure

### Probability Distribution
Shows breakdown across all 3 classifications:
- **Layak** (USABLE) - Green bar
- **Perlu Perbaikan** (NEEDS_REPAIR) - Yellow bar
- **Tidak Layak** (NOT_USABLE) - Red bar

### Reasoning
Provides human-readable explanation of the factors:
- Item age assessment
- Physical condition evaluation
- Repair history analysis
- Usage pattern interpretation

## Algorithm Inputs Explained

### 1. Umur Barang (Item Age)
- **Input**: Years (e.g., 2.5 = 2 years 6 months)
- **Impact**: Older items = lower usability score
- **Note**: Auto-filled from acquisition date

### 2. Frekuensi Penggunaan (Usage Frequency)
- **Input**: Times per month (e.g., 15)
- **Impact**: More usage = better maintained
- **Meaning**: How many times/month borrowed or used

### 3. Jumlah Perbaikan (Repair Count)
- **Input**: Number of times repaired (e.g., 3)
- **Impact**: More repairs = lower usability
- **Note**: Auto-filled from item data

### 4. Skor Kondisi (Condition Score)
- **Input**: 1-5 scale (click buttons)
- **Impact**: Primary indicator of current state
- **Scale**:
  - 1️⃣ = Buruk (Poor) - Broken/Non-functional
  - 2️⃣ = Jelek (Bad) - Major damage
  - 3️⃣ = Sedang (Medium) - Some issues
  - 4️⃣ = Baik (Good) - Minor issues
  - 5️⃣ = Sempurna (Perfect) - Like new

## API Usage (For Developers)

### Endpoint
```
POST /api/evaluasi
```

### Request Body
```json
{
  "itemId": "uuid-of-item",
  "ageInYears": 2.5,
  "frequencyPerMonth": 15,
  "repairsCount": 1,
  "conditionScore": 4
}
```

### Response
```json
{
  "evaluation": {
    "id": "evaluation-uuid",
    "itemId": "item-uuid",
    "evaluationDate": "2026-04-30T...",
    "features": {
      "ageInYears": 2.5,
      "frequencyPerMonth": 15,
      "repairsCount": 1,
      "conditionScore": 4
    },
    "result": {
      "classification": "USABLE",
      "probability": 0.95,
      "percentageScore": 95,
      "usableProbability": 0.95,
      "needsRepairProbability": 0.04,
      "notUsableProbability": 0.01,
      "usablePercentage": 95,
      "needsRepairPercentage": 4,
      "notUsablePercentage": 1,
      "confidence": 0.91,
      "confidencePercentage": 91,
      "reasoning": "Barang masih layak digunakan. Alasan: Sering digunakan (> 20 kali/bulan)."
    }
  }
}
```

## Troubleshooting

### "Only admin can access this page"
- Make sure you're logged in as admin
- Check user role in database: `SELECT role FROM "User" WHERE email = 'your@email.com'`

### Items not showing in dropdown
- Make sure items are created in inventory first
- Items must have all required fields

### Invalid feature values
- Age must be >= 0
- Frequency must be >= 0
- Repairs must be >= 0
- Condition score must be 1-5

### Results seem incorrect
- Verify input values are realistic
- Check condition score is 1-5
- Review reasoning provided for each factor

## Feature Highlights

✨ **Pure TypeScript Implementation**
- No external ML libraries
- Fully transparent algorithm
- Easy to understand and modify

✨ **Bayesian Classification**
- Uses Gaussian probability distribution
- Includes prior probabilities
- Calculates posterior probabilities
- Proper probability normalization

✨ **3-Class Classification**
- USABLE: Item is operational
- NEEDS_REPAIR: Item works but needs maintenance
- NOT_USABLE: Item should be discarded

✨ **Comprehensive Output**
- Classification result
- Confidence score
- Probability for each class
- Human-readable reasoning
- Stored in database for audit trail

✨ **Real-time Processing**
- No ML model training needed
- Instant classification
- Runs on regular server (no GPU needed)

## Next Steps

After testing the evaluation feature, consider:
1. Create batch evaluations for multiple items
2. Generate evaluation reports
3. Track evaluation history over time
4. Use results for maintenance planning
5. Export statistics for analysis

---

**Questions?** Check the implementation details in `NAIVE_BAYES_IMPLEMENTATION.md`
