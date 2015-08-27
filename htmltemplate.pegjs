{
  function join(s) {
    return s.join("");
  }

  function token(object, line, column) {
    var preventPositionCalculation = (
      options.reducePositionLookups &&
      (
        object.type === BLOCK_TYPES.TEXT ||
        object.type === BLOCK_TYPES.CONDITION_BRANCH ||
        object.type === BLOCK_TYPES.ALTERNATE_CONDITION_BRANCH ||
        object.type === ATTRIBUTE_TYPES.EXPRESSION ||
        object.type === ATTRIBUTE_TYPES.PAIR ||
        object.type === ATTRIBUTE_TYPES.SINGLE
      )
    );

    if (!preventPositionCalculation) {
      object.position = {
        line: line(),
        column: column()
      };
    }

    return object;
  }

  function syntaxError(message, offset, line, column) {
    return new SyntaxError(
      message,
      null,
      null,
      offset(),
      line(),
      column()
    );
  }

  var BLOCK_TYPES = {
    COMMENT: "Comment",
    TAG: "Tag",
    TEXT: "Text",
    CONDITION: "Condition",
    CONDITION_BRANCH: "ConditionBranch",
    ALTERNATE_CONDITION_BRANCH: "AlternateConditionBranch",
    INVALID_TAG: "InvalidTag"
  };

  var ATTRIBUTE_TYPES = {
    EXPRESSION: "Expression",
    PAIR: "PairAttribute",
    SINGLE: "SingleAttribute"
  };

  var COLUMN_ONE = function() {
    return 1;
  }
}

Content = (Comment / ConditionalTag / BlockTag / SingleTag / BlockHtmlTag / SingleHtmlTag / InvalidTag / Text)*

Comment
  = CommentTag
  / FullLineComment
  / SingleLineComment

SingleTag = OpeningBracket name:$(SingleTagName !TagNameCharacter+) attributes:Attributes* ClosingBracket {
  return token({
    type: BLOCK_TYPES.TAG,
    name: name,
    attributes: attributes
  }, line, column);
}

SingleHtmlTag = OpeningBracket name:$(HtmlTagName !TagNameCharacter+) attributes:Attributes* SelfClosingBracket {
  return token({
    type: BLOCK_TYPES.TAG,
    name: name,
    attributes: attributes
  }, line, column);
}

BlockTag = start:StartTag content:Content end:EndTag {
  if (start.name != end) {
    throw syntaxError("Expected a </" + start.name + "> but </" + end + "> found.", offset, line, column);
  }

  return token({
    type: BLOCK_TYPES.TAG,
    name: start.name,
    attributes: start.attributes,
    content: content
  }, line, column);
}

ConditionalTag = start:ConditionStartTag content:Content elsif:ElsIfTag* otherwise:ElseTag? end:ConditionEndTag {
  if (start.name != end) {
    throw syntaxError("Expected a </" + start.name + "> but </" + end + "> found.", offset, line, column);
  }

  var primaryCondition = token({
    type: BLOCK_TYPES.CONDITION_BRANCH,
    condition: start.condition,
    content: content
  }, line, column);

  var conditions = [primaryCondition].concat(elsif);

  return token({
    type: BLOCK_TYPES.CONDITION,
    name: start.name,
    conditions: conditions,
    otherwise: otherwise
  }, line, column);
}

InvalidTag = (OpeningEndBracket / OpeningBracket) name:UnknownTagName attributes:Attributes* ClosingBracket {
  return token({
    type: BLOCK_TYPES.INVALID_TAG,
    name: name,
    attributes: attributes
  }, line, column);
}

ElsIfTag = condition:ElsIfStartTag content:Content {
  return token({
    type: BLOCK_TYPES.CONDITION_BRANCH,
    condition: condition,
    content: content
  }, line, column);
}

ElseTag = ElseStartTag content:Content {
  return token({
    type: BLOCK_TYPES.ALTERNATE_CONDITION_BRANCH,
    content: content
  }, line, column);
}

NonText
  = Comment
  / SingleTag
  / StartTag
  / EndTag
  / ConditionStartTag
  / ElsIfStartTag
  / ElseStartTag
  / ConditionEndTag
  / InvalidTag
  / StartHtmlTag
  / EndHtmlTag

Text = text:$(!NonText SourceCharacter)+ {
  return token({
    type: BLOCK_TYPES.TEXT,
    content: text
  }, line, column);
}

StartTag = OpeningBracket name:BlockTagName attributes:Attributes* ClosingBracket {
  return {
    name: name,
    attributes: attributes
  };
}

// FIXME: Not capturing attributes on end tag for now.
EndTag = OpeningEndBracket name:BlockTagName Attributes* ClosingBracket {
  return name;
}

ConditionStartTag = OpeningBracket name:ConditionalTagName condition:Attributes* ClosingBracket {
  return {
    name: name,
    condition: condition[0] || null
  };
}

ElsIfStartTag = OpeningBracket ElsIfTagName condition:Attributes* ClosingBracket {
  return condition[0] || null;
}

ElseStartTag
  = OpeningBracket ElseTagName ClosingBracket

ConditionEndTag = OpeningEndBracket name:ConditionalTagName ClosingBracket {
  return name;
}

SingleLineComment = CommentStart c:$(!LineTerminator SourceCharacter)* {
  return token({
    type: BLOCK_TYPES.COMMENT,
    content: c
  }, line, column);
}

FullLineComment = FullLineCommentStart c:$(!LineTerminator SourceCharacter)* {
  return token({
    type: BLOCK_TYPES.COMMENT,
    content: c
  }, line, COLUMN_ONE);
}

CommentTag = CommentTagStart content:$(!CommentTagEnd SourceCharacter)* CommentTagEnd {
  return token({
    type: BLOCK_TYPES.COMMENT,
    content: content
  }, line, column);
}

Attributes
  = WhiteSpace+ attrs:(AttributeWithValue / AttributeWithoutValue) { return attrs; }
  // Expressions don't require whitespace to be separated from tag names.
  / WhiteSpace* expression:PerlExpression { return expression; }

PerlExpression = PerlExpressionStart expression:$(!PerlExpressionEnd SourceCharacter)* PerlExpressionEnd {
  return token({
    type: ATTRIBUTE_TYPES.EXPRESSION,
    value: expression
  }, line, column);
}

AttributeWithValue = name:AttributeToken "=" value:(AttributeToken / PerlExpression / QuotedString) {
  return token({
    type: ATTRIBUTE_TYPES.PAIR,
    name: name,
    value: value
  }, line, column);
}

AttributeWithoutValue = name:(AttributeToken / QuotedString) {
  return token({
    type: ATTRIBUTE_TYPES.SINGLE,
    name: name,
    value: null
  }, line, column);
}

AttributeToken = n:$[a-zA-Z0-9\-_/:\.{}\$]+ {
  if (n.indexOf("$") > 0) {
    throw syntaxError("Unexpected $ in attribute name.", offset, line, column);
  }

  return n;
}

QuotedString
  = SingleQuotedString
  / DoubleQuotedString

SingleQuotedString = "'" chars:SingleStringCharacter* "'" {
  return join(chars);
}

DoubleQuotedString = "\"" chars:DoubleStringCharacter* "\"" {
  return join(chars);
}

KnownTagName
  = BlockTagName
  / ConditionalTagName
  / ElsIfTagName
  / ElseTagName

UnknownTagName
  = $(!KnownTagName "TMPL_" TagNameCharacter+)

SingleTagName
  // The order here is important, longer tag name goes first.
  = "TMPL_INCLUDE"
  / "TMPL_VAR"
  / "TMPL_V"

BlockTagName
  = "TMPL_BLOCK"
  / "TMPL_FOR"
  / "TMPL_LOOP"
  / "TMPL_SETVAR"
  / "TMPL_WITH"
  / "TMPL_WS"

ConditionalTagName
  = "TMPL_IF"
  / "TMPL_UNLESS"

ElsIfTagName
  = "TMPL_ELSIF"

ElseTagName
  = "TMPL_ELSE"

CommentTagName
  = "TMPL_COMMENT"

WhiteSpaceControlStart "whitespace control character"
  = "-"
  / "~."
  / "~|"
  / "~"

WhiteSpaceControlEnd "whitespace control character"
  = "-"
  / ".~"
  / "|~"
  / "~"

CommentTagStart
  = OpeningBracket CommentTagName ClosingBracket

CommentTagEnd
  = OpeningEndBracket CommentTagName ClosingBracket

TagNameCharacter
  = [a-zA-Z_]

WhiteSpace "whitespace"
  = "\t"
  / "\v"
  / "\f"
  / " "
  / "\u00A0"
  / "\uFEFF"
  / [\u0020\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]
  / LineTerminator

FullLineCommentStart
  = LineTerminator (!CommentStart "#")

CommentStart
  = "##"

SourceCharacter
  = .

LineTerminator "end of line"
  = "\n"
  / "\r\n"
  / "\r"
  / "\u2028"
  / "\u2029"

OpeningBracket
  = "<" (WhiteSpaceControlStart WhiteSpace*)?

OpeningEndBracket
  = "<" WhiteSpaceControlStart? "/"

ClosingBracket
  = WhiteSpace* WhiteSpaceControlEnd? ">"
  / !">" SourceCharacter+ {
    throw syntaxError("Expected a closing bracket.", offset, line, column);
  }

SelfClosingBracket
  = WhiteSpace* WhiteSpaceControlEnd? "/>"
  / !">" SourceCharacter+ {
    throw syntaxError("Expected a closing bracket.", offset, line, column);
  }

PerlExpressionStart
  = "[%" WhiteSpace*

PerlExpressionEnd
  = WhiteSpace* "%]"

SingleStringCharacter
  = !("'" / "\\" / LineTerminator) SourceCharacter { return text(); }
  / "\\" esc:SingleEscapeCharacter { return esc; }

DoubleStringCharacter
  = !("\"" / "\\" / LineTerminator) SourceCharacter { return text(); }
  / "\\" esc:SingleEscapeCharacter { return esc; }

SingleEscapeCharacter
  = "'"
  / '"'
  / "\\"
  / "b"  { return "\b"; }
  / "f"  { return "\f"; }
  / "n"  { return "\n"; }
  / "r"  { return "\r"; }
  / "t"  { return "\t"; }
  / "v"  { return "\v"; }

BlockHtmlTag = start:StartHtmlTag content:Content end:EndHtmlTag {
  if (start.name != end) {
    throw syntaxError("Expected a </" + start.name + "> but </" + end + "> found.", offset, line, column);
  }

  return token({
    type: BLOCK_TYPES.TAG,
    name: start.name,
    attributes: start.attributes,
    content: content
  }, line, column);
}

StartHtmlTag = "<" name:HtmlTagName attributes:Attributes* ">" {
  return { 
    name: name,
    attributes: attributes
  }
}

EndHtmlTag = "</" name:HtmlTagName ">" { return name; }

HtmlTagName = chars:[a-zA-Z0-9]+ { return chars.join(""); }
