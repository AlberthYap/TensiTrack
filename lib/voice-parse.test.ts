import { describe, it, expect } from 'vitest'
import { extractNumbers, parseBloodPressureTranscript } from './voice-parse'

describe('extractNumbers', () => {
  it('extracts raw digit groups', () => {
    expect(extractNumbers('120 80')).toEqual([120, 80])
    expect(extractNumbers('120/80')).toEqual([120, 80])
    expect(extractNumbers('120,80 72')).toEqual([120, 80, 72])
  })

  it('parses Indonesian digit-by-digit words', () => {
    expect(extractNumbers('satu dua nol')).toEqual([120])
    expect(extractNumbers('satu dua nol per delapan nol')).toEqual([120, 80])
  })

  it('parses Indonesian tens and hundreds', () => {
    expect(extractNumbers('seratus dua puluh')).toEqual([120])
    expect(extractNumbers('seratus dua puluh per delapan puluh')).toEqual([120, 80])
    expect(extractNumbers('tujuh puluh dua')).toEqual([72])
    expect(extractNumbers('seratus dua puluh delapan puluh')).toEqual([120, 80])
  })

  it('handles separators and mixed forms', () => {
    expect(extractNumbers('120 per 80')).toEqual([120, 80])
    expect(extractNumbers('120 80')).toEqual([120, 80])
    expect(extractNumbers('seratus dua puluh 80')).toEqual([120, 80])
  })

  it('splits consecutive "seratus" groups', () => {
    expect(extractNumbers('seratus tiga puluh satu seratus sepuluh seratus sebelas')).toEqual([131, 110, 111])
  })

  it('splits long digit-by-digit runs into 3-digit numbers', () => {
    expect(extractNumbers('satu tiga satu satu satu nol satu satu satu')).toEqual([131, 110, 111])
  })

  it('ignores non-number words', () => {
    expect(extractNumbers('tekanan darah seratus dua puluh per delapan puluh')).toEqual([120, 80])
    expect(extractNumbers('')).toEqual([])
  })
})

describe('parseBloodPressureTranscript', () => {
  it('parses plain digits', () => {
    expect(parseBloodPressureTranscript('120 80')).toEqual({
      systolic: 120,
      diastolic: 80,
      pulse: null,
    })
  })

  it('parses digits with pulse', () => {
    expect(parseBloodPressureTranscript('120 80 72')).toEqual({
      systolic: 120,
      diastolic: 80,
      pulse: 72,
    })
  })

  it('parses 131 110 111 in word form', () => {
    expect(parseBloodPressureTranscript('seratus tiga puluh satu seratus sepuluh seratus sebelas')).toEqual({
      systolic: 131,
      diastolic: 110,
      pulse: 111,
    })
    expect(parseBloodPressureTranscript('satu tiga satu satu satu nol satu satu satu')).toEqual({
      systolic: 131,
      diastolic: 110,
      pulse: 111,
    })
  })

  it('parses Indonesian words', () => {
    expect(parseBloodPressureTranscript('seratus dua puluh per delapan puluh')).toEqual({
      systolic: 120,
      diastolic: 80,
      pulse: null,
    })
    expect(parseBloodPressureTranscript('satu dua nol per delapan nol')).toEqual({
      systolic: 120,
      diastolic: 80,
      pulse: null,
    })
  })

  it('heals dropped "puluh" — "120 8" means 120 80', () => {
    expect(parseBloodPressureTranscript('120 8')).toEqual({
      systolic: 120,
      diastolic: 80,
      pulse: null,
    })
    expect(parseBloodPressureTranscript('120 delapan')).toEqual({
      systolic: 120,
      diastolic: 80,
      pulse: null,
    })
  })

  it('heals dropped zero — "12 80" means 120 80', () => {
    expect(parseBloodPressureTranscript('12 80')).toEqual({
      systolic: 120,
      diastolic: 80,
      pulse: null,
    })
  })

  it('returns partial when only systolic is recognized', () => {
    const result = parseBloodPressureTranscript('120')
    expect(result).toEqual({
      systolic: 120,
      diastolic: null,
      pulse: null,
      partial: true,
    })
  })

  it('returns nulls for unrecognizable input', () => {
    expect(parseBloodPressureTranscript('halo apa kabar')).toEqual({
      systolic: null,
      diastolic: null,
      pulse: null,
    })
    expect(parseBloodPressureTranscript('')).toEqual({
      systolic: null,
      diastolic: null,
      pulse: null,
    })
  })

  it('rejects out-of-range values', () => {
    expect(parseBloodPressureTranscript('30 10')).toEqual({
      systolic: null,
      diastolic: null,
      pulse: null,
    })
  })
})
