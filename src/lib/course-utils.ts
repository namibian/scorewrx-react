import * as Papa from 'papaparse'
import JSZip from 'jszip'
import type { Teebox, Hole } from '@/types'

/**
 * Parse CSV file containing teebox data
 * Supports two formats:
 * 1. Detailed format: One row per hole (Teebox Name, Slope, Rating, Hole, Par, Yardage, Handicap)
 * 2. Compact format: One row per teebox (Name, Slope, Rating, Hole1, Hole2, ... with par/yardage/handicap)
 */
export const parseTeeboxCSV = (file: File): Promise<Teebox[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (results) => {
        try {
          if (!results.data || results.data.length < 2) {
            throw new Error('CSV file appears to be empty or invalid')
          }

          const data = results.data as string[][]
          
          // Clean and normalize headers
          const headers = data[0].map(h => h?.trim().toLowerCase() || '')

          // Detect format
          const isDetailedFormat = headers.includes('teebox name') &&
                                   headers.includes('slope') &&
                                   headers.includes('rating') &&
                                   headers.includes('hole') &&
                                   headers.includes('par') &&
                                   headers.includes('yardage') &&
                                   headers.includes('handicap')

          const rows = data.slice(1).filter(row => row[0]?.trim())
          const teeboxes: Record<string, Teebox & { holes: (Hole | null)[] }> = {}

          if (isDetailedFormat) {
            // Process detailed format (one row per hole)
            const teeboxNameIdx = headers.indexOf('teebox name')
            const slopeIdx = headers.indexOf('slope')
            const ratingIdx = headers.indexOf('rating')
            const holeIdx = headers.indexOf('hole')
            const parIdx = headers.indexOf('par')
            const yardageIdx = headers.indexOf('yardage')
            const handicapIdx = headers.indexOf('handicap')

            rows.forEach(row => {
              const teeboxName = row[teeboxNameIdx]?.trim()
              if (!teeboxName) return

              const slope = parseFloat(row[slopeIdx])
              const rating = parseFloat(row[ratingIdx])
              const holeNum = parseInt(row[holeIdx])
              const par = parseInt(row[parIdx])
              const yardage = parseInt(row[yardageIdx])
              const handicap = parseInt(row[handicapIdx])

              if (!teeboxes[teeboxName]) {
                teeboxes[teeboxName] = {
                  name: teeboxName,
                  slope,
                  rating,
                  holes: Array(18).fill(null)
                }
              }

              const holeIndex = holeNum - 1
              if (holeIndex >= 0 && holeIndex < 18) {
                teeboxes[teeboxName].holes[holeIndex] = {
                  par: par as 3 | 4 | 5,
                  yardage,
                  handicap
                }
              }
            })
          } else {
            // Process compact format (one row per teebox)
            // Format: Name, Slope, Rating, Hole1 (par/yardage/handicap), Hole2, ...
            rows.forEach(row => {
              const [name, slopeStr, ratingStr, ...holeData] = row
              if (!name?.trim()) return

              const holes: (Hole | null)[] = []

              // Process hole data (par/yardage/handicap format)
              for (let i = 0; i < 18 && i < holeData.length; i++) {
                const holeStr = holeData[i]?.trim() || ''
                const [parStr, yardageStr, handicapStr] = holeStr.split('/')
                
                const par = parseInt(parStr)
                const yardage = parseInt(yardageStr)
                const handicap = parseInt(handicapStr)

                if (!isNaN(par) && !isNaN(yardage) && !isNaN(handicap)) {
                  holes.push({
                    par: par as 3 | 4 | 5,
                    yardage,
                    handicap
                  })
                } else {
                  holes.push(null)
                }
              }

              // Pad to 18 holes if needed
              while (holes.length < 18) {
                holes.push(null)
              }

              teeboxes[name.trim()] = {
                name: name.trim(),
                slope: parseFloat(slopeStr),
                rating: parseFloat(ratingStr),
                holes
              }
            })
          }

          // Validate and convert teeboxes
          const teeboxArray = Object.values(teeboxes)
          
          // Validate each teebox
          const validatedTeeboxes: Teebox[] = []
          
          for (const teebox of teeboxArray) {
            // Check basic info
            if (!teebox.name || isNaN(teebox.slope) || isNaN(teebox.rating)) {
              throw new Error(`Invalid teebox data: ${teebox.name || 'Unknown'} - missing name, slope, or rating`)
            }

            // Check holes
            const validHoles: Hole[] = []
            const usedHandicaps = new Set<number>()

            for (let i = 0; i < 18; i++) {
              const hole = teebox.holes[i]
              if (!hole) {
                throw new Error(`Invalid teebox "${teebox.name}": Missing data for hole ${i + 1}`)
              }

              if (![3, 4, 5].includes(hole.par)) {
                throw new Error(`Invalid teebox "${teebox.name}": Hole ${i + 1} has invalid par (${hole.par}). Must be 3, 4, or 5.`)
              }

              if (!hole.yardage || hole.yardage <= 0) {
                throw new Error(`Invalid teebox "${teebox.name}": Hole ${i + 1} has invalid yardage`)
              }

              if (!hole.handicap || hole.handicap < 1 || hole.handicap > 18) {
                throw new Error(`Invalid teebox "${teebox.name}": Hole ${i + 1} has invalid handicap (${hole.handicap}). Must be 1-18.`)
              }

              if (usedHandicaps.has(hole.handicap)) {
                throw new Error(`Invalid teebox "${teebox.name}": Duplicate handicap value ${hole.handicap}`)
              }
              usedHandicaps.add(hole.handicap)

              validHoles.push(hole)
            }

            validatedTeeboxes.push({
              name: teebox.name,
              slope: teebox.slope,
              rating: teebox.rating,
              holes: validHoles
            })
          }

          if (validatedTeeboxes.length === 0) {
            throw new Error('No valid teeboxes found in CSV file')
          }

          resolve(validatedTeeboxes)
        } catch (error) {
          reject(error)
        }
      },
      error: (error) => {
        reject(new Error(`Failed to parse CSV file: ${error.message}`))
      }
    })
  })
}

/**
 * Generate CSV content from teeboxes (detailed format)
 */
export const generateTeeboxCSV = (teeboxes: Teebox[]): string => {
  const rows: string[][] = []

  // Header row
  rows.push(['Teebox Name', 'Slope', 'Rating', 'Hole', 'Par', 'Yardage', 'Handicap'])

  // Data rows
  teeboxes.forEach(teebox => {
    teebox.holes?.forEach((hole, index) => {
      rows.push([
        teebox.name,
        String(teebox.slope || ''),
        String(teebox.rating || ''),
        String(index + 1),
        String(hole.par),
        String(hole.yardage || ''),
        String(hole.handicap)
      ])
    })
  })

  return rows.map(row => row.join(',')).join('\n')
}

/**
 * Download CSV template files (both formats in a zip)
 */
export const downloadCSVTemplate = async (): Promise<void> => {
  // Create detailed template
  const detailedTemplate = [
    ['Teebox Name', 'Slope', 'Rating', 'Hole', 'Par', 'Yardage', 'Handicap'],
    ['Blue', '132', '71.2', '1', '4', '450', '5'],
    ['Blue', '132', '71.2', '2', '3', '165', '7'],
    ['Blue', '132', '71.2', '3', '5', '525', '1'],
    ['Blue', '132', '71.2', '4', '4', '410', '9'],
    ['Blue', '132', '71.2', '5', '3', '180', '15'],
    ['Blue', '132', '71.2', '6', '4', '420', '3'],
    ['Blue', '132', '71.2', '7', '4', '390', '11'],
    ['Blue', '132', '71.2', '8', '5', '535', '13'],
    ['Blue', '132', '71.2', '9', '4', '400', '17'],
    ['Blue', '132', '71.2', '10', '4', '430', '4'],
    ['Blue', '132', '71.2', '11', '3', '175', '8'],
    ['Blue', '132', '71.2', '12', '5', '545', '2'],
    ['Blue', '132', '71.2', '13', '4', '415', '10'],
    ['Blue', '132', '71.2', '14', '3', '170', '16'],
    ['Blue', '132', '71.2', '15', '4', '425', '6'],
    ['Blue', '132', '71.2', '16', '4', '395', '12'],
    ['Blue', '132', '71.2', '17', '5', '540', '14'],
    ['Blue', '132', '71.2', '18', '4', '405', '18'],
    ['White', '128', '69.8', '1', '4', '430', '5'],
    ['White', '128', '69.8', '2', '3', '155', '7'],
    ['White', '128', '69.8', '3', '5', '505', '1'],
    // ... abbreviated for template
  ]

  // Create compact template
  const compactTemplate = [
    ['Name', 'Slope', 'Rating', 'Hole1', 'Hole2', 'Hole3', 'Hole4', 'Hole5', 'Hole6', 'Hole7', 'Hole8', 'Hole9',
     'Hole10', 'Hole11', 'Hole12', 'Hole13', 'Hole14', 'Hole15', 'Hole16', 'Hole17', 'Hole18'],
    ['Blue', '132', '71.2', '4/450/5', '3/165/7', '5/525/1', '4/410/9', '3/180/15', '4/420/3', '4/390/11', '5/535/13', '4/400/17',
     '4/430/4', '3/175/8', '5/545/2', '4/415/10', '3/170/16', '4/425/6', '4/395/12', '5/540/14', '4/405/18'],
    ['White', '128', '69.8', '4/430/5', '3/155/7', '5/505/1', '4/390/9', '3/165/15', '4/400/3', '4/370/11', '5/515/13', '4/380/17',
     '4/410/4', '3/160/8', '5/525/2', '4/395/10', '3/155/16', '4/405/6', '4/375/12', '5/520/14', '4/385/18']
  ]

  // Create a zip file containing both templates
  const zip = new JSZip()
  zip.file('detailed_template.csv', Papa.unparse(detailedTemplate))
  zip.file('compact_template.csv', Papa.unparse(compactTemplate))

  // Add README
  const readme = `# Teebox CSV Templates

## Detailed Format (detailed_template.csv)
One row per hole. Columns:
- Teebox Name: Name of the teebox (e.g., "Blue", "White")
- Slope: Course slope rating (55-155)
- Rating: Course rating (60-80)
- Hole: Hole number (1-18)
- Par: Par for the hole (3, 4, or 5)
- Yardage: Distance in yards
- Handicap: Hole handicap (1-18, each value must be unique)

## Compact Format (compact_template.csv)
One row per teebox. Columns:
- Name: Teebox name
- Slope: Course slope rating
- Rating: Course rating
- Hole1-Hole18: Each hole's data in format "par/yardage/handicap"
  Example: "4/450/5" means Par 4, 450 yards, Handicap 5

## Notes
- All 18 holes must be provided for each teebox
- Handicap values must be unique (1-18) within each teebox
- Par values must be 3, 4, or 5
`
  zip.file('README.txt', readme)

  // Generate and download the zip file
  const content = await zip.generateAsync({ type: 'blob' })
  const url = window.URL.createObjectURL(content)
  const a = document.createElement('a')
  a.href = url
  a.download = 'course_teeboxes_templates.zip'
  a.click()
  window.URL.revokeObjectURL(url)
}

/**
 * Export a single course's teeboxes to CSV
 */
export const exportCourseTeeboxes = (courseName: string, teeboxes: Teebox[]): void => {
  const csvContent = generateTeeboxCSV(teeboxes)
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.setAttribute('download', `${courseName.replace(/\s+/g, '_')}_teeboxes.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

