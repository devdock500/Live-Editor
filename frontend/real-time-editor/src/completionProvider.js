let providersRegistered = false;

export const registerCompletionProviders = (monaco) => {
    if (providersRegistered) return;
    providersRegistered = true;

    // Helper to create simple snippet completion
    const createSnippet = (label, insertText, documentation, kind = monaco.languages.CompletionItemKind.Snippet) => ({
        label,
        kind,
        documentation,
        insertText,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    });

    // Helper to create keyword completion
    const createKeyword = (label, insertText, documentation) => ({
        label,
        kind: monaco.languages.CompletionItemKind.Keyword,
        documentation,
        insertText,
    });

    // --- JavaScript ---
    monaco.languages.registerCompletionItemProvider('javascript', {
        provideCompletionItems: () => {
            const suggestions = [
                createKeyword('con', 'console.log(${1:item});', 'Console log'),
                createKeyword('imp', 'import ${1:module} from \'${2:path}\';', 'Import statement'),
                createSnippet('for', 'for (let ${1:i} = 0; ${1:i} < ${2:array}.length; ${1:i}++) {\n\t${3}\n}', 'For Loop'),
                createSnippet('func', 'function ${1:name}(${2:params}) {\n\t${3}\n}', 'Function Definition'),
                createSnippet('if', 'if (${1:condition}) {\n\t${2}\n}', 'If Statement'),
                createSnippet('try', 'try {\n\t${1}\n} catch (error) {\n\tconsole.error(error);\n}', 'Try-Catch Block'),
                createSnippet('arrow', 'const ${1:name} = (${2:params}) => {\n\t${3}\n};', 'Arrow Function'),
                createSnippet('rafce', 'import React from \'react\';\n\nconst ${1:ComponentName} = () => {\n\treturn (\n\t\t<div>${1:ComponentName}</div>\n\t);\n};\n\nexport default ${1:ComponentName};', 'React Arrow Function Component'),
            ];
            return { suggestions };
        }
    });

    // --- Python ---
    monaco.languages.registerCompletionItemProvider('python', {
        provideCompletionItems: () => {
            const suggestions = [
                createKeyword('pr', 'print(${1:item})', 'Print statement'),
                createSnippet('def', 'def ${1:function_name}(${2:args}):\n\t${3:pass}', 'Function definition'),
                createSnippet('if', 'if ${1:condition}:\n\t${2:pass}', 'If statement'),
                createSnippet('for', 'for ${1:item} in ${2:iterable}:\n\t${3:pass}', 'For loop'),
                createSnippet('try', 'try:\n\t${1:pass}\nexcept ${2:Exception} as e:\n\t${3:print(e)}', 'Try-Except block'),
                createSnippet('class', 'class ${1:ClassName}:\n\tdef __init__(self, ${2:args}):\n\t\t${3:pass}', 'Class definition'),
                createSnippet('main', 'if __name__ == "__main__":\n\t${1:main()}', 'Main block'),
            ];
            return { suggestions };
        }
    });

    // --- Java ---
    monaco.languages.registerCompletionItemProvider('java', {
        provideCompletionItems: () => {
            const suggestions = [
                createKeyword('sout', 'System.out.println(${1:item});', 'Print to console'),
                createSnippet('main', 'public static void main(String[] args) {\n\t${1}\n}', 'Main method'),
                createSnippet('class', 'public class ${1:ClassName} {\n\t${2}\n}', 'Class definition'),
                createSnippet('for', 'for (int ${1:i} = 0; ${1:i} < ${2:limit}; ${1:i}++) {\n\t${3}\n}', 'For loop'),
                createSnippet('if', 'if (${1:condition}) {\n\t${2}\n}', 'If statement'),
                createSnippet('try', 'try {\n\t${1}\n} catch (Exception e) {\n\te.printStackTrace();\n}', 'Try-Catch block'),
            ];
            return { suggestions };
        }
    });

    // --- C/C++ ---
    const cppSuggestions = [
        createKeyword('include', '#include <${1:iostream}>', 'Include header'),
        createSnippet('main', 'int main() {\n\t${1}\n\treturn 0;\n}', 'Main function'),
        createSnippet('for', 'for (int ${1:i} = 0; ${1:i} < ${2:limit}; ${1:i}++) {\n\t${3}\n}', 'For loop'),
        createSnippet('if', 'if (${1:condition}) {\n\t${2}\n}', 'If statement'),
        createSnippet('cout', 'std::cout << ${1:message} << std::endl;', 'Print to stdout'),
        createSnippet('class', 'class ${1:ClassName} {\npublic:\n\t${1:ClassName}();\n\t~${1:ClassName}();\n};', 'Class definition'),
    ];

    monaco.languages.registerCompletionItemProvider('cpp', {
        provideCompletionItems: () => ({ suggestions: cppSuggestions })
    });
    monaco.languages.registerCompletionItemProvider('c', {
        provideCompletionItems: () => ({ suggestions: cppSuggestions })
    });

    // --- HTML ---
    monaco.languages.registerCompletionItemProvider('html', {
        provideCompletionItems: () => {
            const suggestions = [
                createSnippet('html5', '<!DOCTYPE html>\n<html lang="en">\n<head>\n\t<meta charset="UTF-8">\n\t<meta name="viewport" content="width=device-width, initial-scale=1.0">\n\t<title>${1:Document}</title>\n</head>\n<body>\n\t${2}\n</body>\n</html>', 'HTML5 Boilerplate'),
                createSnippet('div', '<div class="${1:class}">\n\t${2}\n</div>', 'Div with class'),
                createSnippet('script', '<script src="${1:src}"></script>', 'Script tag'),
                createSnippet('style', '<style>\n\t${1}\n</style>', 'Style tag'),
            ];
            return { suggestions };
        }
    });

    // --- CSS ---
    monaco.languages.registerCompletionItemProvider('css', {
        provideCompletionItems: () => {
            const suggestions = [
                createSnippet('flex', 'display: flex;\njustify-content: ${1:center};\nalign-items: ${2:center};', 'Flexbox center'),
                createSnippet('grid', 'display: grid;\ngrid-template-columns: repeat(${1:3}, 1fr);\ngap: ${2:10px};', 'CSS Grid'),
                createSnippet('media', '@media (max-width: ${1:768px}) {\n\t${2}\n}', 'Media Query'),
            ];
            return { suggestions };
        }
    });
};
