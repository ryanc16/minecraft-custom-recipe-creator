#!/bin/env node
import fs, { realpathSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import readline from 'node:readline/promises';
import { pathToFileURL } from 'node:url';

import archiver from 'archiver';
import { globSync } from 'glob';
import yaml from 'yaml';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import RecipeGenerator from "./lib/recipe_generator.mjs";

const RECIPES_YML_TEMPLATE = 'variables:\n' +
    '# Define values to use in your rules here!\n' +
    'rules:\n' +
    '# Add your own custom rules here!';

async function main(args) {
    // console.debug(args);
    if (args.command === 'init') {
        await initProject(args);
    } else if (args.command === 'generate') {
        await generateProject(args);
    }
}

async function initProject(args) {
    const project = {
        name: '',
        description: '',
        version: '1.0.0',
        include: []
    };
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    if (args.name == null || args.name.trim() === '') {
        let input = '';
        while (input.trim() === '') {
            input = await rl.question('Project name: ');
            if (input.trim() === '') {
                rl.write(null, { ctrl: true, name: 'u' });
                console.log('Must provide a project name!');
                rl.write;
            }
        }
        project.name = input.trim();
    } else {
        project.name = args.name;
    }
    if (args.description == null || args.description.trim() === '') {
        const input = await rl.question('Project description: ');
        project.description = input.trim();
    } else {
        project.description = args.description;
    }
    if (args.version == null || args.version === '') {
        const input = await rl.question('Project version (1.0.0): ');
        if (input.trim() !== '') {
            project.version = input.trim();
        }
    } else {
        project.version = args.version;
    }
    let createReadme = false;
    if (args.createReadme === 'prompt') {
        const response = await rl.question('Create readme? [Y/n]: ');
        if (['Y', 'y', 'yes', ''].includes(response.trim())) {
            createReadme = true;
        }
    } else if (args.createReadme === true) {
        createReadme = true;
    }
    const readmeExists = fs.existsSync(path.join(args.dir, 'README.md'));
    if (readmeExists === true) {
        if (createReadme === true) {
            let response = 'y';
            if (args.force === false) {
                response = await rl.question('README.md already exists in datapack project directory! Overwrite? [y/N]: ');
            }
            if (['Y', 'y', 'yes'].includes(response.trim())) {
                createReadme = true;
                console.warn('[WARN] Will overwrite README.md');
            } else {
                createReadme = false;
                console.info('[INFO] Will not create README.md');
            }
        }
        project.include.push('README.md');
    }
    // Show summary
    console.log(JSON.stringify(project, null, 4));
    let proceed = 'Y';
    if (args.quiet === false) {
        proceed = await rl.question('Does this look correct? [Y/n]: ');
    }
    if (['Y', 'y', 'yes', ''].includes(proceed.trim())) {
        if (!fs.existsSync(path.join(args.dir))) {
            fs.mkdirSync(path.join(args.dir), { recursive: true, force: true });
        }
        fs.writeFileSync(path.join(args.dir, 'mcrc.json'), JSON.stringify(project, null, 4));
        if (createReadme === true) {
            const readmeText = `# ${project.name} v${project.version}\n` +
                `${project.description}`;
            fs.writeFileSync(path.join(args.dir, 'README.md'), readmeText);

        }
        if (!fs.existsSync(path.join(args.dir, 'src'))) {
            fs.mkdirSync(path.join(args.dir, 'src'));
        }
        const cleanName = project.name.trim().replace(/\s/g, '_');
        if (!fs.existsSync(path.join(args.dir, 'src', cleanName, 'recipes'))) {
            fs.mkdirSync(path.join(args.dir, 'src', cleanName, 'recipes'), { recursive: true, force: true });
        }
        // dont be destructive if a recipes.yml file already exists!
        if (!fs.existsSync(path.join(args.dir, 'src', cleanName, 'recipes', 'recipes.yml'))) {
            fs.writeFileSync(path.join(args.dir, 'src', cleanName, 'recipes', 'recipes.yml'), RECIPES_YML_TEMPLATE);
        }
        rl.write(`Datapack "${project.name}" created in ${args.dir}\n`);
    } else {
        rl.write('Aborting!\n');
    }
    rl.close();
}

async function generateProject(args) {
    if (!fs.existsSync(path.join(args.projectdir, 'mcrc.json'))) {
        console.error('Couldn\'t find mcrc.json in ' + args.projectdir);
        process.exit(1);
    }
    const proj = JSON.parse(fs.readFileSync(path.join(args.projectdir, 'mcrc.json')));
    if (!fs.existsSync(path.join(args.projectdir, 'build'))) {
        fs.mkdirSync(path.join(args.projectdir, 'build'));
    }
    const buildDir = path.join(args.projectdir, 'build');
    const srcDir = path.join(args.projectdir, 'src');

    const validate = args.validate ? args.validate.trim().includes(':') ? true : false : false;
    let mcVersion = null;
    if (validate) {
        const validateOn = args.validate;
        for (const pair of validateOn.split(',')) {
            const [key, value] = pair.split(':');
            if (key === 'version') {
                mcVersion = value;
            }
        }
    }
    let options = null;
    if (validate) {
        options = {};
        if (mcVersion != null) {
            options.validate = { version: mcVersion };
        }
    }
    const packmeta = {
        pack: {
            pack_format: 15,
            description: proj.description
        }
    };
    fs.writeFileSync(path.join(buildDir, 'pack.mcmeta'), JSON.stringify(packmeta, null, 4));
    const cleanName = proj.name.trim().replace(/\s/g, '_');

    const buildGeneratedDataDir = path.join(buildDir, 'data');
    fs.mkdirSync(buildGeneratedDataDir, { recursive: true, force: true });
    const generatorsSourceDir = path.join(srcDir, 'data_gen');
    const generators = globSync(path.join(generatorsSourceDir, '*.{m}js').replace(/\\/g, '/'));
    for (const generator of generators) {
        console.info(`Executing data generator ${generator}`);
        const buffer = execSync(`${nodeBinaryPath} ${generator} -o ${buildGeneratedDataDir}`);
        buffer.toString('utf-8').split('\n').forEach(line => console.info(line));
    }
    // glob expects forward slashes / ALWAYS, regardless of OS path separators.
    const rulesets = globSync(path.join(srcDir, "**", "*.yml").replace(/\\/g, '/'));
    let rulecount = 0;
    for (const ruleset of rulesets) {
        console.info(`Parsing rulesheet ${ruleset}`);
        const doc = yaml.parse(fs.readFileSync(ruleset).toString('utf-8'));
        if (doc == null || doc.rules == null) {
            console.warn('No rules found in rulesheet!');
            continue;
        }
        rulecount += doc.rules.length;
        // for (const doc of docs) {
        const generator = new RecipeGenerator(buildGeneratedDataDir, cleanName, mcVersion ? { validate: { version: mcVersion } } : null);
        generator.init();
        await generator.processRules(doc.rules, { variables: doc?.variables });
        // }
    }
    if (rulecount < 1) {
        return;
    }
    for (const file of proj.include) {
        fs.copyFileSync(path.join(args.projectdir, file), path.join(buildDir, file));
    }

    const archiveName = `${cleanName}-${proj.version}.zip`;
    const archive = archiver('zip', {
        zlib: { level: 9 }
    });
    const out = fs.createWriteStream(path.join(args.projectdir, archiveName));
    archive.pipe(out);
    archive.directory(buildDir, false);
    archive.on('finish', function(...args) {
        out.close((err) => {
            if (err) {
                throw err;
            } else {
                console.info(`wrote: ${out.path}, ${archive.pointer()} bytes`);
            }
        });
    });
    archive.finalize();
}

async function processDirectory() {
    const buildDir = path.join(projDir, 'build');
    const buildGenerationDir = path.join(buildDir, 'generated');
    const buildGeneratedDataDir = path.join(buildGenerationDir, projConf.name, 'data');
    fs.mkdirSync(buildGeneratedDataDir, { recursive: true, force: true });
    const generatorsSourceDir = path.join(projDir, 'src', 'data_gen');
    const generators = globSync(path.join(generatorsSourceDir, '*.mjs'));
    for (const generator of generators) {
        gulplog.info(`Executing data generator ${generator}`);
        const buffer = execSync(`${nodeBinaryPath} ${generator} -o ${buildGeneratedDataDir}`);
        buffer.toString('utf-8').split('\n').forEach(line => gulplog.info(line));
    }
    const rulesets = globSync(path.join(generatorsSourceDir, "*.yml"));
    for (const ruleset of rulesets) {
        gulplog.info(`Parsing ruleset ${ruleset}`);
        const doc = yaml.parse(fs.readFileSync(ruleset).toString('utf-8'));
        // for (const doc of docs) {
        const generator = new RecipeGenerator(buildGeneratedDataDir, projConf.name, { validate: doc.validate ?? {} });
        generator.init();
        await captureConsoleInfoInGulpLog(async () => {
            await generator.processRules(doc.rules, { variables: doc?.variables });
        });
        // }
    }
}


/**
 * Checks if the current ES Module file is being run directly as a CLI command
 * instead of being imported by another file.
 * This is designed to work correctly with symlinks created by `npm bin`.
 * @returns {boolean}
 */
function wasCalledAsScript() {
    // Use realpathSync to resolve symbolic links that npm creates for binaries.
    const realPath = realpathSync(process.argv[1]);
    // Convert the resolved file path back to a file:// URL for comparison.
    const realPathAsUrl = pathToFileURL(realPath).href;

    // Compare the resolved path to the URL of the current module.
    return import.meta.url === realPathAsUrl;
}

if (wasCalledAsScript()) {
    const argv = yargs(hideBin(process.argv))
        .middleware(_argv => {
            if (_argv._.length > 0) {
                _argv.command = _argv._.shift();
            }
        })
        .usage('Usage: $0 <command> [options] <projectdir>')
        .command('init', 'Initialize a recipes project interactively. Will prompt for any information that isn\'t provided directly via options.',
            (_yargs) => {
                return _yargs
                    .usage('Usage: $0 init [options]')
                    .version(false)
                    .option('name', {
                        alias: 'n',
                        describe: 'Name of the datapack.',
                        type: 'string',
                        demandOption: false
                    })
                    .option('description', {
                        alias: 'd',
                        describe: 'Description of the datapack.',
                        type: 'string',
                        demandOption: false
                    })
                    .option('version', {
                        alias: 'v',
                        describe: 'The initial version of the datapack.',
                        type: 'string',
                        demandOption: false
                    })
                    .option('create-readme', {
                        describe: 'Initialize the datapack with a README.',
                        type: 'boolean',
                        default: 'prompt',
                        demandOption: false
                    })
                    .option('force', {
                        alias: 'f',
                        describe: 'Don\'t warn or prompt about overwriting or existing files.',
                        type: 'boolean',
                        default: false,
                        demandOption: false
                    })
                    .option('quiet', {
                        alias: 'q',
                        describe: 'Don\'t prompt for confirmation before initializing the project.',
                        type: 'boolean',
                        default: false,
                        demandOption: false
                    })
                    .positional('dir', {
                        describe: 'The directory the datapack project will be initialized.',
                        type: 'string',
                        normalize: true,
                        demandOption: true
                    });
            },
            (_argv) => {
                if (_argv._.length > 0) {
                    const resolvedPath = path.resolve(_argv._.shift().trim());
                    const baseDir = path.dirname(resolvedPath);
                    if (!fs.existsSync(baseDir)) {
                        console.error(`Provided datapack project directory "${baseDir}" does not exist!`);
                        process.exit(1);
                    }
                    if (fs.existsSync(path.join(resolvedPath, 'mcrc.json')) && _argv.force === false) {
                        console.error('The provided datapack project directory appears to not be empty and already contains an mcrc.json');
                        process.exit(1);
                    }
                    _argv.dir = resolvedPath;
                } else {
                    // const resolvedPath = path.resolve(process.cwd());
                    // _argv.dir = resolvedPath;
                    console.error('A project directory is required!');
                    process.exit(1);
                }
            }
        )
        .command('generate <projectdir>', 'Process the provided recipe sources.',
            (_yargs) => {
                return _yargs
                    .usage('Usage: $0 generate [options] <projectdir>')
                    .version(false)
                    .positional('projectdir', {
                        describe: 'A directory containing the mcrc project.',
                        type: 'string',
                        demandOption: 'Source rules are required'
                    }).option('validate', {
                        describe: 'Enable validation features.\n' +
                            'ex: --validate version:1.20.1',
                        type: 'string',
                        demandOption: false
                    });
            },
            (_argv) => {
                const resolvedPath = path.resolve(process.cwd(), _argv.projectdir.trim());
                if (!fs.existsSync(resolvedPath)) {
                    console.error(`Provided sources "${resolvedPath}" does not exist!`);
                    process.exit(1);
                } else {
                    _argv.projectdir = resolvedPath;
                }
            }
        )
        // .option('out-dir', {
        //     alias: 'o',
        //     describe: 'The base directory to output recipe files.\n' +
        //         'If omitted, the current directory will be used',
        //     type: 'string',
        //     demandOption: false
        // })
        // .option('name', {
        //     alias: 'n',
        //     describe: 'The name of your recipe datapack',
        //     type: 'string',
        //     demandOption: 'The datapack name is required!'
        // })


        .help()
        .argv;
    main(argv);
}
