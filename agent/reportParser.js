function parseReport(slitherOutput) {

    const detectors = slitherOutput.results?.detectors || [];

    return detectors.map(d => ({
        vulnerability: d.check,
        impact: d.impact,
        confidence: d.confidence,
        description: d.description
    }));

}

export default parseReport;