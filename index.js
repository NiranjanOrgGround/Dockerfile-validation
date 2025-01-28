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
    
    // Exit with error if any validation failed
    if (!results.baseImage.valid || results.tools.some(tool => !tool.valid)) {
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

function extractVersion(content, patterns) {
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

function validateTools(lines) {
  const content = lines.join('\n');
  const tools = [
    {
      name: 'Java',
      patterns: [
        /(?:openjdk-|java-|jdk)(\d+)/i,
        /java\s+(\d+)/i
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
        /node(?:js)?[- ](\d+)/i,
        /nodejs[- ](\d+)/i
      ],
      allowedVersions: standards.nodeVersions
    },
    {
      name: 'Python',
      patterns: [
        /python(\d+(?:\.\d+)?)/i,
        /python[- ](\d+(?:\.\d+)?)/i
      ],
      allowedVersions: standards.pythonVersions
    }
  ];

  return tools.map(tool => {
    const detectedVersion = extractVersion(content, tool.patterns);
    const found = detectedVersion !== null;
    let isAllowedVersion = false;

    if (found) {
      // Check if the detected version matches any allowed version
      isAllowedVersion = tool.allowedVersions.some(allowed => {
        // Handle both exact matches and version prefixes
        return detectedVersion === allowed || detectedVersion.startsWith(allowed + '.');
      });
    }

    return {
      name: tool.name,
      valid: found && isAllowedVersion,
      version: detectedVersion,
      message: !found 
        ? `${tool.name} not found`
        : !isAllowedVersion
        ? `${tool.name} version ${detectedVersion} is not allowed. Allowed versions: ${tool.allowedVersions.join(', ')}`
        : `${tool.name} found (version ${detectedVersion})`
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
  results.tools.forEach(tool => {
    console.log(`  ${tool.name}:`);
    console.log(`    Status: ${tool.valid ? '✅ Found' : '❌ Not Found'}`);
    console.log(`    Details: ${tool.message}`);
  });
  
  // Summary
  const totalTools = results.tools.length;
  const validTools = results.tools.filter(t => t.valid).length;
  console.log(`\nSummary: ${validTools}/${totalTools} required tools found`);
}

// Main execution
const dockerfilePath = process.env.DOCKERFILE_PATH || './cosmos/Dockerfile';
validateDockerfile(dockerfilePath);
