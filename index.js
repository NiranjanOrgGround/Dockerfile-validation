const fs = require('fs');
const path = require('path');

// Load company standards
const standards = JSON.parse(fs.readFileSync('./managed_files/standards.json', 'utf8'));

function validateDockerfile(dockerfilePath) {
  try {
    const content = fs.readFileSync(dockerfilePath, 'utf8');
    const lines = content.split('\n');
    
    const results = {
      baseImage: validateBaseImage(lines),
      tools: validateTools(lines)
    };
    
    logResults(results);
    
    // Exit with error if base image is invalid or if any found tool has invalid version
    const foundToolsWithInvalidVersions = results.tools.filter(tool => tool.found && !tool.valid);
    if (!results.baseImage.valid || foundToolsWithInvalidVersions.length > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Error validating Dockerfile:', error);
    process.exit(1);
  }
}

function validateBaseImage(lines) {
  const fromLine = lines.find(line => line.trim().startsWith('FROM'));
  if (!fromLine) {
    return {
      valid: false,
      message: 'Base image not found'
    };
  }

  const baseImage = fromLine.split(' ')[1];
  const isValidImage = baseImage === standards.baseImage;

  return {
    valid: isValidImage,
    message: isValidImage 
      ? `Base image is valid: ${baseImage}`
      : `Invalid base image: ${baseImage}. Expected: ${standards.baseImage}`,
    image: baseImage
  };
}

function normalizeVersion(version) {
  const parts = version.split('.');
  if (parts.length > 2) {
    return parts[0];  // Return only major version
  }
  return version;
}

function extractVersion(content, patterns) {
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const version = match[1];
      return normalizeVersion(version);
    }
  }
  return null;
}

function extractRunInstructions(lines) {
  let runInstructions = [];
  let currentInstruction = '';
  
  for (let line of lines) {
    line = line.trim();
    
    // Start of a new RUN instruction
    if (line.startsWith('RUN')) {
      if (currentInstruction) {
        runInstructions.push(currentInstruction);
      }
      currentInstruction = line.substring(3).trim();
    }
    // Continuation of current instruction
    else if (currentInstruction && line.endsWith('\\')) {
      currentInstruction += ' ' + line.slice(0, -1).trim();
    }
    // End of current instruction
    else if (currentInstruction) {
      currentInstruction += ' ' + line;
      runInstructions.push(currentInstruction);
      currentInstruction = '';
    }
  }
  
  // Add last instruction if exists
  if (currentInstruction) {
    runInstructions.push(currentInstruction);
  }
  
  return runInstructions;
}

function validateTools(lines) {
  const runInstructions = extractRunInstructions(lines);
  const content = runInstructions.join('\n');
  
  const tools = [
    {
      name: 'Java',
      patterns: [
        /(?:openjdk-|java-|jdk)(\d+(?:\.\d+)?)/i,
        /java\s+(\d+(?:\.\d+)?)/i,
        /jdk-(\d+(?:\.\d+)?)/i
      ],
      allowedVersions: standards.jdkVersions
    },
    {
      name: 'Maven',
      patterns: [
        /maven[- ](\d+\.\d+)/i,
        /mvn[- ](\d+\.\d+)/i
      ],
      allowedVersions: standards.mavenVersions
    },
    {
      name: 'Gradle',
      patterns: [
        /gradle[- ](\d+\.\d+)/i
      ],
      allowedVersions: standards.gradleVersions
    },
    {
      name: 'Go',
      patterns: [
        /go(\d+\.\d+)/i,
        /golang[- ](\d+\.\d+)/i
      ],
      allowedVersions: standards.goVersions
    },
    {
      name: 'Node',
      patterns: [
        /nvm install\s+v?(\d+(?:\.\d+(?:\.\d+)?)?)/i,
        /node\/v(\d+(?:\.\d+(?:\.\d+)?)?)/i,
        /versions\/node\/v(\d+(?:\.\d+(?:\.\d+)?)?)/i
      ],
      allowedVersions: standards.nodeVersions
    },
    {
      name: 'Python',
      patterns: [
        /python(\d+(?:\.\d+)?)/i,
        /python[- ](\d+(?:\.\d+)?)/i,
        /\/python(\d+(?:\.\d+)?)/i,
        /\bpython(\d+(?:\.\d+)?)\b/i,
        /easy_install-(\d+(?:\.\d+)?)/i,
        /python(\d+\.\d+)\b/i,
        /python(\d+)(?!\.\d)/i,
        /zlib1g-dev\s+libncurses5-dev.*python/i
      ],
      allowedVersions: standards.pythonVersions
    }
  ];

  return tools.map(tool => {
    const detectedVersion = extractVersion(content, tool.patterns);
    const found = detectedVersion !== null;
    let isAllowedVersion = false;

    if (found) {
      isAllowedVersion = tool.allowedVersions.some(allowed => {
        return allowed === detectedVersion;
      });
    }

    return {
      name: tool.name,
      found: found,
      valid: !found || isAllowedVersion,
      version: detectedVersion,
      message: !found 
        ? `${tool.name} not found (optional)`
        : !isAllowedVersion
        ? `${tool.name} version ${detectedVersion} is not allowed. Allowed versions: ${tool.allowedVersions.join(', ')}`
        : `${tool.name} found with valid version ${detectedVersion}`
    };
  });
}

function logResults(results) {
  console.log('\n=== Dockerfile Validation Results ===\n');
  
  // Log base image results
  console.log('Base Image:');
  console.log(`  Status: ${results.baseImage.valid ? '✅ Valid' : '❌ Invalid'}`);
  console.log(`  Details: ${results.baseImage.message}\n`);
  
  // Log tools results
  console.log('Tools:');
  const foundTools = results.tools.filter(tool => tool.found);
  
  if (foundTools.length === 0) {
    console.log('  No tools detected in Dockerfile');
  } else {
    foundTools.forEach(tool => {
      console.log(`  ${tool.name}:`);
      console.log(`    Status: ${tool.valid ? '✅ Valid' : '❌ Invalid'}`);
      console.log(`    Details: ${tool.message}`);
    });
  }
  
  // Summary
  const foundToolsCount = foundTools.length;
  const validToolsCount = foundTools.filter(t => t.valid).length;
  console.log(`\nSummary: ${validToolsCount}/${foundToolsCount} detected tools have valid versions`);
}

// Main execution
const dockerfilePath = process.env.DOCKERFILE_PATH || './cosmos/Dockerfile';
validateDockerfile(dockerfilePath);
