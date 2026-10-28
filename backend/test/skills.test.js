const test = require('node:test');
const assert = require('node:assert/strict');
const { computeFit, skillMatches, splitRequirements, extractKnownSkills } = require('../utils/skills.js');

test('java does not match javascript', () => {
    assert.equal(skillMatches('Java', 'JavaScript'), false);
    assert.equal(skillMatches('JavaScript', 'JS'), true);
});

test('aliases and phrases match', () => {
    assert.equal(skillMatches('React', 'React.js'), true);
    assert.equal(skillMatches('Node', '2+ years of Node.js'), true);
    assert.equal(skillMatches('DSA', 'Data Structures and Algorithms'), true);
});

test('computeFit scores matched requirements', () => {
    const fit = computeFit(['React', 'Node.js', 'MongoDB', 'Docker'], ['reactjs', 'mongo'], [{ skill: 'React' }]);
    assert.equal(fit.score, 50);
    assert.deepEqual(fit.missing, ['Node.js', 'Docker']);
    assert.deepEqual(fit.verifiedMatched, ['React']);
});

test('computeFit handles empty requirements', () => {
    assert.equal(computeFit([], ['react']).score, 0);
});

test('splitRequirements splits bullets and commas', () => {
    assert.deepEqual(splitRequirements(['React, Node • SQL']), ['React', 'Node', 'SQL']);
});

test('extractKnownSkills finds skills in resume text', () => {
    const found = extractKnownSkills('Built a MERN app using React, Node.js, Express and MongoDB. Knowledge of Git & Docker.');
    for (const skill of ['react', 'node', 'express', 'mongodb', 'git', 'docker']) assert.ok(found.includes(skill), skill);
    assert.ok(!found.includes('java'));
});
